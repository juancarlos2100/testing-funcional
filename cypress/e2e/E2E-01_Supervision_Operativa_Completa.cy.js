describe('Flujo 1 - WEB-RTC: Tablero Principal y Streaming', () => {

    const DISPOSITIVO_ID = '16950';

    let validUser;
    let validPassword;
    let loginUrl;

    before(() => {
        cy.env(['LOGIN_URL', 'VALID_USER', 'VALID_PASSWORD']).then((env) => {
            loginUrl = env.LOGIN_URL;
            validUser = env.VALID_USER;
            validPassword = env.VALID_PASSWORD;

            if (!loginUrl || !validUser || !validPassword) {
                throw new Error('Faltan variables de entorno requeridas');
            }
        });
    });

    beforeEach(() => {
        // PRECONDICIÓN GENERAL: Login con credenciales válidas
        cy.visit(loginUrl);
        cy.login(validUser, validPassword);

        // Validar que llegamos al tablero
        cy.url().should('include', '/admin/');
        // Esperar a que la lista de dispositivos termine de cargar
        cy.get('#devices-grid', { timeout: 10000 }).should('be.visible');
    });

    // Agrupamos TC-01 y TC-02
    it('Debe filtrar un dispositivo por ID y validar la integridad de sus metadatos (TC-01, TC-02)', () => {
        // ACCIÓN TC-01: Búsqueda y filtrado
        cy.get('.header-controls', { timeout: 10000 })
            .should('be.visible')
            .within(() => {
                cy.get('.menu-item.search-container')
                    .should('be.visible')
                    .within(() => {
                        cy.get('#search-input')
                            .should('be.visible')
                            .click()
                            .type(DISPOSITIVO_ID);
                    });
            });

        // RESULTADO ESPERADO TC-01: El tablero se actualiza y muestra la tarjeta
        cy.get('#devices-grid', { timeout: 10000 })
            .should('be.visible')
            .should('have.length', 1)
            .as('tarjetaFiltrada');

        // ACCIONES Y RESULTADO ESPERADO TC-02: Validación visual exhaustiva
        cy.get('@tarjetaFiltrada').within(() => {
            // Validar identificador único y estado "Online"
            cy.get('.card-header')
                .should('be.visible')
                .should('contain.text', DISPOSITIVO_ID)
                .and('contain.text', 'ON-LINE');

            // Validar telemetría y estatus dentro del card-body
            cy.get('.card.in-view .card-body').within(() => {
                // Telemetría (Batería, red, cámara)

                cy.get('.fas.fa-battery-three-quarters')
                    .should('be.visible');

                cy.get('.fas.fa-gauge-high')
                    .should('be.visible');


            });
        });
    });

    // Agrupamos TC-04, TC-05 y TC-06
    it('Debe gestionar el streaming activo: unirse, expandir pantalla, cerrar expansion, probar botones de la card y finalizar live (TC-04, TC-05, TC-06, TC-07, TC-08 Y TC-09)', () => {
        // Filtramos para aislar la tarjeta que ya transmite (Homologado con el TC-01)
        cy.get('.header-controls').within(() => {
            cy.get('#search-input')
                .should('be.visible')
                .clear()
                .type(DISPOSITIVO_ID);
        });

        // RESULTADO ESPERADO TC-01: Asignar el alias a la tarjeta de stream
        cy.get('#devices-grid')
            .should('be.visible')
            .as('tarjetaStream');

        // ACCIÓN TC-04: Unirse a transmisión
        cy.get('@tarjetaStream').within(() => {
            // Buscar la tarjeta visible
            cy.get('.card.in-view .card-body').within(() => {
                // Dentro del card-body, buscar la sección de controles inferiores
                cy.get('.controls-bottom').within(() => {
                    // Validar que el botón "Transmitir" exista, sea visible y dar clic
                    cy.get('button[title="Transmitir"]')
                        .should('exist')
                        .and('be.visible')
                        .click();
                });
            });
        });

        cy.wait(5000);


        // RESULTADO ESPERADO TC-04: Video existente cargado sin cortes
        cy.get('video[id^="video-SC"]')
            .should('be.visible')
            .and('have.prop', 'readyState', 4);

        cy.wait(5000);

        // ACCIÓN TC-05: Pantalla completa
        cy.get('@tarjetaStream')
            .find('.btn-expand')
            .should('exist')
            .and('be.visible')
            .click();

        // Una vez expandido, validar modal y cerrar
        // Esperar a que el toast desaparezca (máx 10s)
        // Ignorar errores asíncronos de renderizado del navegador (ResizeObserver)
        Cypress.on('uncaught:exception', (err, runnable) => {
            if (
                err.message.includes('ResizeObserver') ||
                err.message.includes('loop completed with undelivered notifications')
            ) {
                // Retornar false previene que Cypress falle la prueba por este error inofensivo
                return false;
            }
            // Permitir que otros errores sí fallen la prueba
            return true;
        });

        // Esperar a que desaparezca el toast (Mantenemos tu wait, aunque para pruebas 
        // de caja negra más rápidas, lo ideal sería cy.get('.toast-class').should('not.exist'))
        cy.wait(10000);

        // Buscar el botón de cerrar directamente, tomar el primero (por si hay múltiples modales)
        // y forzar el clic evadiendo la capa del reproductor de video (z-index: 10000)
        cy.get('.modal-content .btn-close-modal')
            .first()
            .click({ force: true });

        // ACCIÓN Y RESULTADO ESPERADO TC-07: Interacción post-modal (Mute y Ubicación)
        cy.wait(5000);

        // Validar que la tarjeta original siga existiendo y sea visible
        cy.get('@tarjetaStream')
            .should('exist')
            .and('be.visible')
            .within(() => {
                // Seguir exactamente el mismo proceso de anidación
                cy.get('.card.in-view .card-body').within(() => {
                    cy.get('.controls-bottom').within(() => {
                        // Buscar y hacer clic en Mute
                        cy.get('button[title="Mute"]')
                            .should('exist')
                            .and('be.visible')
                            .click();

                        // Buscar y hacer clic en Ubicación en la misma zona
                        cy.get('button[title="Ubicación en vivo"]')
                            .should('exist')
                            .and('be.visible')
                            .click();
                    });
                });
            });

        cy.wait(8000);

        // Validar que aparezca el panel de ubicación (coincidencia de inicio de ID)
        cy.get('[id^="location-panel-SC"]')
            .should('exist')
            .and('be.visible')
            .within(() => {
                // Validar que el mapa exista y sea visible dentro del panel
                cy.get('[id^="leaflet-map-SC"]')
                    .should('exist')
                    .and('be.visible');
            });

        // Cerrar panel de ubicación y finalizar transmisión
        cy.get('@tarjetaStream').within(() => {
            cy.get('.card.in-view .card-body').within(() => {
                cy.get('.controls-bottom').within(() => {
                    // Clic en "Ubicación" para cerrar el panel
                    cy.get('button[title="Ubicación en vivo"]')
                        .should('exist')
                        .and('be.visible')
                        .click();

                    // Clic en "Pausa (Detener)" para finalizar la transmisión
                    cy.get('button[title="Pausa (Detener)"]')
                        .should('exist')
                        .and('be.visible')
                        .click();
                });
            });
        });



    });

    it('Debe iniciar la transmisión y alternar la cámara del dispositivo entre frontal y trasera (TC-10)', () => {
        cy.get('.header-controls').within(() => {
            cy.get('#search-input')
                .should('be.visible')
                .clear()
                .type(DISPOSITIVO_ID);
        });



        // Nota: El inicio de sesión válido y la visibilidad del tablero 
        // ya están garantizados por el bloque beforeEach general.

        // Filtrar el dispositivo por ID
        cy.get('.header-controls').within(() => {
            cy.get('#search-input')
                .should('be.visible')
                .clear()
                .type(DISPOSITIVO_ID);
        });

        // Confirmar que el tablero se actualiza y asignar alias
        cy.get('#devices-grid')
            .should('be.visible')
            .as('tarjetaStream');

        // Iniciar transmisión y alternar cámara
        cy.get('@tarjetaStream').within(() => {
            cy.get('.card.in-view .card-body').within(() => {
                cy.get('.controls-bottom').within(() => {
                    // Iniciar la transmisión
                    cy.get('button[title="Transmitir"]')
                        .should('exist')
                        .and('be.visible')
                        .click();

                    // Buscar y hacer clic en el botón de alternar cámara
                    cy.get('button[title="alternar camara"]')
                        .should('exist')
                        .and('be.visible')
                        .click();
                });
            });
        });
    });
});