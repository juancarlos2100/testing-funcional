describe('Flujo 2 - Configuración de Video (sin Transmisión)', () => {

    const DISPOSITIVO_ID = '20659';
    const DISPOSITIVO_ID_SIN_CONEXION = '20659'; // Ajusta este ID a un dispositivo que esté desconectado para el test de error de conexión

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

    it('Debe consultar la configuración de video actual y validar las opciones disponibles, y valida que guarda la configuración seleccionada cuando NO hay una transmisión en curso (TC-01 Y TC-02)', () => {
        // Filtrar el dispositivo por ID para asegurar que trabajamos sobre la tarjeta correcta
        cy.get('.header-controls').within(() => {
            cy.get('#search-input')
                .should('be.visible')
                .clear()
                .type(DISPOSITIVO_ID);
        });

        // Asignar alias a la tarjeta filtrada
        cy.get('#devices-grid')
            .should('be.visible')
            .as('tarjetaStream');

        // Buscar y hacer clic en el botón de Configurar
        cy.get('@tarjetaStream').within(() => {
            cy.get('.card.in-view').within(() => {
                cy.get('.card-header').within(() => {
                    // El estatus 'ON-LINE' convive en esta zona, buscamos el botón Configurar
                    cy.get('button[title="Configurar"]')
                        .should('exist')
                        .and('be.visible')
                        .click();
                });
            });
        });

        cy.wait(2000);

        // Validar la visibilidad del panel de configuración
        cy.get('[id^="settings-panel-SC"]')
            .should('exist')
            .and('be.visible')
            .as('panelConfiguracion'); // Asignamos alias para facilitar las siguientes búsquedas

        cy.wait(2000);

        // Interactuar con las opciones de configuración dentro del panel y asignar valores
        // Interactuar inyectando eventos nativos que cruzan el Shadow DOM
        cy.get('@panelConfiguracion').within(() => {

            // ---------------------------------------------------------
            // 1. Interacción con Resolución (800x600)
            // ---------------------------------------------------------
            cy.get('[id^="set-res-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    // 1. Asignamos el valor directamente al nodo HTML
                    elementoNativo.value = '800x600';
                    // 2. Disparamos el evento nativo con 'composed: true' para atravesar el Shadow DOM
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000); // Espera para que el framework reaccione al cambio

            // ---------------------------------------------------------
            // 2. Interacción con FPS (20)
            // ---------------------------------------------------------
            cy.get('[id^="set-fps-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    elementoNativo.value = '30';
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000);

            // ---------------------------------------------------------
            // 3. Interacción con Bitrate (500000)
            // ---------------------------------------------------------
            cy.get('[id^="set-bitrate-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    elementoNativo.value = '2000000';
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000);

            // ---------------------------------------------------------
            // 4. Validar existencia y hacer clic en el botón 'Guardar'
            // ---------------------------------------------------------
            cy.contains('button', 'Guardar')
                .should('exist')
                .and('be.visible')
                .click();

            cy.wait(5000);


        });
        cy.get('.toast-success, .alert-success, .modal-success, [role="alert"]', { timeout: 5000 })
            .should('exist')
            .and('be.visible')
            // Opcional: Validar que el texto indique que se guardó
            .invoke('text')
            .should('match', /guardad|éxito|success/i);
    });
    it('Debe iniciar una transmisión, modificar la configuración de video en vivo y validar el guardado (TC-03 y TC-04)', () => {
        // ---------------------------------------------------------
        // 1. Filtrar el dispositivo por ID
        // ---------------------------------------------------------
        cy.get('.header-controls').within(() => {
            cy.get('#search-input')
                .should('be.visible')
                .clear()
                .type(DISPOSITIVO_ID);
        });

        // Asignar alias a la tarjeta filtrada
        cy.get('#devices-grid')
            .should('be.visible')
            .as('tarjetaStream');

        // ---------------------------------------------------------
        // 2. Iniciar la transmisión (Diferencia clave con el flujo anterior)
        // ---------------------------------------------------------
        cy.get('@tarjetaStream').within(() => {
            cy.get('.card.in-view .card-body').within(() => {
                cy.get('.controls-bottom').within(() => {
                    cy.get('button[title="Transmitir"]')
                        .should('exist')
                        .and('be.visible')
                        .click();
                });
            });
        });

        // Esperamos a que la transmisión se inicie correctamente
        cy.wait(5000);

        // ---------------------------------------------------------
        // 3. Abrir el panel de Configuración
        // ---------------------------------------------------------
        cy.get('@tarjetaStream').within(() => {
            cy.get('.card.in-view .card-header').within(() => {
                cy.get('button[title="Configurar"]')
                    .should('exist')
                    .and('be.visible')
                    .click();
            });
        });

        cy.wait(2000);

        // Validar la visibilidad del panel y asignarle alias
        cy.get('[id^="settings-panel-SC"]')
            .should('exist')
            .and('be.visible')
            .as('panelConfiguracion');

        cy.wait(2000);

        // ---------------------------------------------------------
        // 4. Modificar parámetros cruzando el Shadow DOM (Vanilla JS)
        // ---------------------------------------------------------
        cy.get('@panelConfiguracion').within(() => {

            // Resolución (800x600)
            cy.get('[id^="set-res-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    elementoNativo.value = '1920x1080';
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000);

            // FPS (20)
            cy.get('[id^="set-fps-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    elementoNativo.value = '10';
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000);

            // Bitrate (500000)
            cy.get('[id^="set-bitrate-SC"]')
                .should('exist')
                .then(($select) => {
                    const elementoNativo = $select[0];
                    elementoNativo.value = '600000';
                    elementoNativo.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
                });

            cy.wait(2000);

            // Guardar configuración
            cy.contains('button', 'Guardar')
                .should('exist')
                .and('be.visible')
                .click();
        });

        // ---------------------------------------------------------
        // 5. Validación de confirmación de guardado (Fallará intencionalmente)
        // ---------------------------------------------------------
        cy.get('.toast-success, .alert-success, .modal-success, [role="alert"]', { timeout: 5000 })
            .should('exist')
            .and('be.visible')
            .invoke('text')
            .should('match', /guardad|éxito|success/i);

        cy.wait(5000); // Espera para que la UI se estabilice antes de finalizar la transmisión
    });

    it('Validación de UI cuando el socket de la cámara pierde conexión', () => {
        

        // ---------------------------------------------------------
        // 1. INYECCIÓN TÁCTICA: Secuestrar las conexiones ANTES de que nazcan
        // ---------------------------------------------------------
        cy.window().then((win) => {
            // Creamos un arreglo secreto en la ventana del navegador
            win.__conexionesActivas = [];

            // Interceptamos la creación de WebSockets
            const OriginalWebSocket = win.WebSocket;
            win.WebSocket = function (...args) {
                const ws = new OriginalWebSocket(...args);
                win.__conexionesActivas.push({ tipo: 'WebSocket', instancia: ws });
                return ws; // Le devolvemos el socket a la app para que no sospeche
            };

            // Interceptamos la creación de WebRTC (Video)
            const OriginalRTCPeerConnection = win.RTCPeerConnection;
            win.RTCPeerConnection = function (...args) {
                const pc = new OriginalRTCPeerConnection(...args);
                win.__conexionesActivas.push({ tipo: 'WebRTC', instancia: pc });
                return pc;
            };
        });

        // ---------------------------------------------------------
        // 2. Iniciar transmisión normalmente
        // ---------------------------------------------------------
        cy.get('.header-controls').within(() => {
            cy.get('#search-input').clear().type(DISPOSITIVO_ID);
        });

        cy.get('#devices-grid').as('tarjetaStream');


        // Esperamos a que el socket se conecte y el video inicie
        cy.wait(5000);

        // ---------------------------------------------------------
        // 3. CORTAR SOLO LA CONEXIÓN DE LA CÁMARA (CÓDIGO INYECTADO)
        // ---------------------------------------------------------
        cy.log('Destruyendo conexiones activas de WebRTC y WebSockets...');

        cy.window().then((win) => {
            // Recorremos nuestro arreglo secreto y cerramos todo a la fuerza
            win.__conexionesActivas.forEach(conexion => {
                cy.log(`Asesinando conexión tipo: ${conexion.tipo}`);
                // El método .close() es nativo y simula perfectamente una desconexión
                conexion.instancia.close();
            });
        });

        // ---------------------------------------------------------
        // 4. Abrir configuración y setear valores
        // ---------------------------------------------------------
        cy.get('@tarjetaStream').within(() => {
            cy.get('button[title="Configurar"]').click();
        });

        cy.get('[id^="settings-panel-SC"]').as('panelConfiguracion').within(() => {

            cy.get('[id^="set-res-SC"]').then(($select) => {
                $select[0].value = '320x240';
                $select[0].dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            });

            cy.wait(2000);

            // ---------------------------------------------------------
            // 5. Guardar (La API principal sí tiene internet, pero el socket/video está muerto)
            // ---------------------------------------------------------
            cy.contains('button', 'Guardar').click();
        });

        // ---------------------------------------------------------
        // 6. Validar respuesta de la UI
        // ---------------------------------------------------------
        // Esperamos que la app detecte que el socket murió y arroje el error
        cy.get('.toast-error, .alert-warning', { timeout: 10000 })
            .should('exist')
            .and('be.visible');
    });
});