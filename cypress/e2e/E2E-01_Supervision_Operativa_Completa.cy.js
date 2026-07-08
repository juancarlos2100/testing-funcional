describe('Flujo 1 - WEB-RTC: Tablero Principal y Streaming', () => {

  beforeEach(() => {
    // PRECONDICIÓN GENERAL: Login con credenciales válidas
    cy.visit('/login');
    cy.login('testUser', 'TestPassword123!');

    // Validar que llegamos al tablero
    cy.url().should('include', '/dashboard');
    // Esperar a que la lista de dispositivos termine de cargar
    cy.get('[data-cy="device-list"]', { timeout: 10000 }).should('be.visible');
  });

  // Agrupamos TC-01 y TC-02
  it('Debe filtrar un dispositivo por ID y validar la integridad de sus metadatos (TC-01, TC-02)', () => {
    const dispositivoID = 'DEV-9988'; // Dato de prueba

    // ACCIÓN TC-01: Búsqueda y filtrado
    cy.get('[data-cy="search-input"]').click().type(dispositivoID);

    // RESULTADO ESPERADO TC-01: El tablero se actualiza y muestra la tarjeta
    cy.get('[data-cy="device-card"]').should('have.length', 1).as('tarjetaFiltrada');

    // ACCIONES Y RESULTADO ESPERADO TC-02: Validación visual exhaustiva
    cy.get('@tarjetaFiltrada').within(() => {
      // Validar identificador único
      cy.get('[data-cy="lbl-device-id"]').should('contain.text', dispositivoID);
      
      // Validar metadatos operativos
      cy.get('[data-cy="lbl-user-name"]').should('not.be.empty');
      cy.get('[data-cy="status-indicator"]').should('contain.text', 'Online');
      
      // Validar telemetría (Batería, red, cámara)
      cy.get('[data-cy="metric-battery"]').should('exist');
      cy.get('[data-cy="metric-network-type"]').should('exist');
      cy.get('[data-cy="metric-network-quality"]').should('exist');
      
      // Validar estatus de sesión y operativo
      cy.get('[data-cy="lbl-active-session"]').should('contain.text', 'Sesión activa');
      cy.get('[data-cy="lbl-operational-status"]').should('exist');
    });
  });

  // Agrupamos TC-04, TC-05 y TC-06
  it('Debe gestionar el streaming activo: unirse, expandir pantalla y alternar cámaras (TC-04, TC-05, TC-06)', () => {
    const dispositivoConStream = 'DEV-STREAM-01';
    
    // Filtramos para aislar la tarjeta que ya transmite
    cy.get('[data-cy="search-input"]').type(dispositivoConStream);
    cy.get('[data-cy="device-card"]').first().as('tarjetaStream');

    // ACCIÓN TC-04: Unirse a transmisión
    cy.get('@tarjetaStream').find('[data-cy="btn-join-stream"]').click();

    // RESULTADO ESPERADO TC-04: Video existente cargado sin cortes
    // Validación de caja negra: el elemento video existe y tiene suficiente data (readyState 4)
    cy.get('video[data-cy="stream-player"]')
      .should('be.visible')
      .and('have.prop', 'readyState', 4);

    // ACCIÓN TC-05: Pantalla completa
    cy.get('@tarjetaStream').find('[data-cy="btn-fullscreen"]').click();

    // RESULTADO ESPERADO TC-05: Expansión y sobrepuestos (overlay)
    cy.document().its('fullscreenElement').should('not.be.null');
    cy.get('[data-cy="video-overlay-id"]').should('be.visible').and('contain.text', dispositivoConStream);
    cy.get('[data-cy="video-overlay-user"]').should('be.visible');

    // Salir de pantalla completa y validar retorno
    cy.get('[data-cy="btn-exit-fullscreen"]').click(); 
    cy.document().its('fullscreenElement').should('be.null');
    cy.get('video[data-cy="stream-player"]').should('have.prop', 'readyState', 4); // El flujo no se cortó

    // ACCIÓN TC-06: Alternancia entre cámara frontal y trasera
    cy.get('@tarjetaStream').find('[data-cy="lbl-camera-indicator"]').invoke('text').as('camaraInicial');
    cy.get('@tarjetaStream').find('[data-cy="btn-switch-camera"]').click();

    // RESULTADO ESPERADO TC-06: El indicador cambia y el streaming persiste
    cy.get('@camaraInicial').then((camaraInicial) => {
      // Validamos que el texto haya cambiado (ej. de "Frontal" a "Trasera")
      cy.get('@tarjetaStream')
        .find('[data-cy="lbl-camera-indicator"]')
        .should('not.have.text', camaraInicial);
    });
    
    // Verificamos de nuevo la persistencia del reproductor de video
    cy.get('video[data-cy="stream-player"]').should('have.prop', 'readyState', 4);
  });
});