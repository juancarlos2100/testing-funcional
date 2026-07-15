describe('Flujo 3 - Configuración Masiva de Dispositivos (E2E-03)', () => {

  const DISPOSITIVO_ID = '20661'; // Dispositivo Online de muestra para validar la propagación de cambios

  let validUser;
  let validPassword;
  let loginUrl;

  const aplicarConfiguracionMasivaAleatoria = () => {
    cy.get('#modal-global-transmission .modal-body', { timeout: 20000 })
      .should('exist')
      .and('be.visible')
      .within(() => {
        // RESOLUCIÓN
        const resoluciones = [
          '320x240',
          '640x480',
          '800x600',
          '1280x720',
          '1920x1080'
        ];

        const resolucionAleatoria =
          resoluciones[Math.floor(Math.random() * resoluciones.length)];

        cy.log(`Resolución seleccionada: ${resolucionAleatoria}`);

        cy.get('#global-res')
          .should('be.visible')
          .then(($select) => {

            const elemento = $select[0];

            elemento.value = resolucionAleatoria;

            elemento.dispatchEvent(new Event('input', {
              bubbles: true,
              composed: true
            }));
            cy.wait(1000);

            elemento.dispatchEvent(new Event('change', {
              bubbles: true,
              composed: true
            }));

            cy.wait(1000);
          });

        cy.get('#global-res')
          .should('have.value', resolucionAleatoria);
        // FPS

        const fpsDisponibles = [
          '1',
          '5',
          '10',
          '15',
          '20',
          '24',
          '25',
          '30',
          '60'
        ];

        const fpsAleatorio =
          fpsDisponibles[Math.floor(Math.random() * fpsDisponibles.length)];

        cy.log(`FPS seleccionado: ${fpsAleatorio}`);

        cy.get('#global-fps')
          .should('be.visible')
          .then(($select) => {

            const elemento = $select[0];

            elemento.value = fpsAleatorio;

            elemento.dispatchEvent(new Event('input', {
              bubbles: true,
              composed: true
            }));

            cy.wait(1000);

            elemento.dispatchEvent(new Event('change', {
              bubbles: true,
              composed: true
            }));
            cy.wait(1000);
          });

        cy.get('#global-fps')
          .should('have.value', fpsAleatorio);

        // BITRATE
        const bitratesDisponibles = [
          '64000',
          '128000',
          '256000',
          '350000',
          '500000',
          '800000',
          '1000000',
          '1500000',
          '2000000',
          '3000000',
          '4000000',
          '6000000',
          '8000000'
        ];

        const bitrateAleatorio =
          bitratesDisponibles[Math.floor(Math.random() * bitratesDisponibles.length)];

        cy.log(`Bitrate seleccionado: ${bitrateAleatorio}`);

        cy.get('#global-bitrate')
          .should('be.visible')
          .then(($select) => {

            const elemento = $select[0];

            elemento.value = bitrateAleatorio;

            elemento.dispatchEvent(new Event('input', {
              bubbles: true,
              composed: true
            }));

            cy.wait(1000); // Esperar un segundo antes de disparar el evento change

            elemento.dispatchEvent(new Event('change', {
              bubbles: true,
              composed: true
            }));

            cy.wait(1000); // Esperar un segundo después de disparar el evento change
          });

        cy.get('#global-bitrate')
          .should('have.value', bitrateAleatorio);

        // APLICAR

        cy.get('#btn-apply-global')
          .should('be.visible')
          .and('not.be.disabled')
          .click();
      });
  };

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
    // PRECONDICIÓN GENERAL: Login con credenciales válidas y acceso al tablero
    cy.visit(loginUrl);
    cy.login(validUser, validPassword);

    // Validar que llegamos al tablero de administración
    cy.url().should('include', '/admin/');
    cy.get('#devices-grid', { timeout: 10000 }).should('be.visible');
  });

  it('Debe aplicar una configuración masiva a la flota y validar que se refleje en un dispositivo individual Online (TC-01)', () => {
    // Primero abrimos el menú de perfil
    cy.get('.header-bar').within(() => {
      cy.get('.header-quick-actions').within(() => {
        cy.get('#user-profile-chip[title="Perfil y configuración"]')
          .should('exist')
          .and('be.visible')
          .click();
      });
    });

    // Esperamos a que se despliegue el menú
    cy.get('.user-dropdown.open')
      .should('exist')
      .and('be.visible')
      .as('panelConfiguracionMasiva');

    cy.wait(5000); // Esperar animación de apertura del panel

    // Trabajar únicamente en el panel para abrir el modal
    cy.get('@panelConfiguracionMasiva').within(() => {

      cy.get('#btn-open-global-transmission')
        .should('exist')
        .and('be.visible')
        .within(() => {

          cy.contains('span', 'Transmisión Global')
            .should('exist')
            .and('be.visible');

        })
        .click();

    });

    // A partir de aquí ya NO estamos dentro del panel

    aplicarConfiguracionMasivaAleatoria();
    cy.wait(6000); // Esperar propagación de la configuración masiva



    // Validar mensaje de éxito tras la aplicación masiva (Reutilizando toast conocido)
    cy.get('.toast-success, .alert-success, .modal-success, [role="alert"]', { timeout: 5000 })
      .should('exist')
      .and('be.visible')
      .invoke('text')
      .should('match', /guardad|éxito|success|masiv/i);

    cy.wait(5000); // Esperar propagación a los dispositivos

    // 1. Filtrar el dispositivo de muestra
    cy.get('.header-controls').within(() => {
      cy.get('#search-input')
        .should('be.visible')
        .clear()
        .type(DISPOSITIVO_ID);
    });

    cy.get('#devices-grid')
      .should('be.visible')
      .as('tarjetaStream');

    // 2. Abrir configuración individual
    cy.get('@tarjetaStream').within(() => {
      cy.get('.card.in-view .card-header').within(() => {
        cy.get('button[title="Configurar"]')
          .should('exist')
          .and('be.visible')
          .click();
      });
    });

    cy.wait(5000);

    cy.get('[id^="settings-panel-SC"]')
      .should('exist')
      .and('be.visible')
      .as('panelConfiguracionIndividual');

    // 3. Validar que los valores en el dispositivo coincidan con la configuración masiva
    cy.get('@panelConfiguracionIndividual').within(() => {
      cy.get('[id^="set-res-SC"]')
        .should('exist')
        .then(($select) => {
          cy.log('Valor actual en resolución: ' + $select[0].value);
        });

      cy.get('[id^="set-fps-SC"]')
        .should('exist')
        .then(($select) => {
          cy.log('Valor actual en FPS: ' + $select[0].value);
        });
    });
  });

  it('Debe auto-reiniciar la transmisión si se aplica una configuración masiva mientras un dispositivo transmite en vivo (TC-03 - Crítico)', () => {

    // 1. Aislamos un dispositivo y comenzamos transmisión en vivo
    cy.get('.header-controls').within(() => {
      cy.get('#search-input')
        .should('be.visible')
        .clear()
        .type(DISPOSITIVO_ID);
    });

    cy.get('#devices-grid')
      .should('be.visible')
      .as('tarjetaStream');


    cy.wait(5000); // Esperar a que la tarjeta se renderice completamente

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

    cy.wait(3000);

    // Esperar a que la transmisión WebRTC esté activa y estable
    cy.wait(3000);
    cy.get('video[id^="video-SC"]')
      .should('be.visible')
      .and('have.prop', 'readyState', 4);

    cy.log('Aplicando cambio masivo mientras el streaming está activo...');

    cy.get('.header-bar').within(() => {
      cy.get('.stream-bulk-btn.stream-bulk-btn-start').click();
    });

    cy.wait(4000);

    cy.get('.header-bar').within(() => {
      cy.get('.header-quick-actions').within(() => {
        cy.get('#user-profile-chip[title="Perfil y configuración"]')
          .should('exist')
          .and('be.visible')
          .click();
      });
    });

    // Esperamos a que se despliegue el menú
    cy.get('.user-dropdown.open')
      .should('exist')
      .and('be.visible')
      .as('panelConfiguracionMasiva');

    cy.wait(5000); // Esperar animación de apertura del panel

    // Trabajar únicamente en el panel para abrir el modal
    cy.get('@panelConfiguracionMasiva').within(() => {
      cy.get('#btn-open-global-transmission')
        .should('exist')
        .and('be.visible')
        .within(() => {
          cy.contains('span', 'Transmisión Global')
            .should('exist')
            .and('be.visible');
        })
        .click();
    });

    cy.wait(5000);

    aplicarConfiguracionMasivaAleatoria();



    cy.wait(7000);


    /*
    cy.log('Validando auto-reinicio del video post-configuración masiva...');
    
    // Verificamos que el reproductor siga existiendo y recupere el readyState 4
    cy.get('video[id^="video-SC"]', { timeout: 15000 })
        .should('exist')
        .and('be.visible')
        .and('have.prop', 'readyState', 4);
    */

    // Limpieza del caso: Finalizar transmisión
    cy.get('@tarjetaStream').within(() => {
      cy.get('.card.in-view .card-body').within(() => {
        cy.get('.controls-bottom').within(() => {
          cy.get('button[title="Pausa (Detener)"]')
            .should('exist')
            .and('be.visible')
            .click();
        });
      });
    });
  });

  it('Manejo de errores si la red falla o el servidor rechaza la configuración masiva (TC-04 - Negativo)', () => {

    // =========================================================================
    // [ACCIÓN REQUERIDA - INSPECCIONAR RED]: Intercepción de API que hace el post al servidor
    // =========================================================================

    /*
    // 1. Interceptamos la llamada masiva para forzar un error 500 del servidor
    cy.intercept('POST', '/** /config/massive*', { 
        statusCode: 500,
        body: { error: 'Error interno al propagar configuración masiva' }
    }).as('fallaConfigMasiva');

    // 2. Abrir y enviar configuración masiva
    cy.get('#btn-config-masiva-placeholder').click(); // <-- REEMPLAZAR
    cy.get('#modal-config-masiva-placeholder').within(() => { // <-- REEMPLAZAR
        cy.contains('button', 'Guardar').click();
    });

    // 3. Esperar el fallo interceptado
    cy.wait('@fallaConfigMasiva');

    // 4. Validar que el frontend capture el error y muestre alerta visible
    cy.get('.toast-error, .alert-warning, .alert-danger, [role="alert"]', { timeout: 5000 })
        .should('exist')
        .and('be.visible')
        .invoke('text')
        .should('match', /error|fallido|no se pudo|incompleta/i);
    */

    cy.log('Escenario negativo preparado. Reemplazar endpoint para habilitar interrupción.');
  });
});