describe('Flujos Alternativos y Excepciones - Inicio de Sesión Stream RTC', () => {

  let loginUrl;
  let validUser;
  let validPassword;
  let invalidUser;
  let invalidPassword;

  before(() => {
    cy.env(['LOGIN_URL', 'VALID_USER', 'VALID_PASSWORD', 'INVALID_USER', 'INVALID_PASSWORD'])
      .then((env) => {
        loginUrl = env.LOGIN_URL;
        validUser = env.VALID_USER;
        validPassword = env.VALID_PASSWORD;
        invalidUser = env.INVALID_USER;
        invalidPassword = env.INVALID_PASSWORD;

        if (!loginUrl || !validUser || !validPassword || !invalidUser || !invalidPassword) {
          throw new Error('Missing one or more required Cypress env values');
        }
      });
  });

  beforeEach(() => {
    // Precondición: El usuario se encuentra en la pantalla de inicio de sesión
    cy.visit(loginUrl);
  });

  it('CP-F1-002-01: Inicio de sesión con usuario inválido', () => {
    // 1 y 2. Capturar usuario inválido y contraseña válida
    cy.get('input[name="usuario"]').type(invalidUser);
    cy.get('input[type="password"]').type(validPassword);

    // 3. Seleccionar Iniciar Sesión
    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // Resultado esperado: Solo se requiere que la alerta de error exista y sea visible
    cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');
  });

  it('CP-F1-002-02: Inicio de sesión con contraseña inválida', () => {
    // 1 y 2. Capturar usuario válido y contraseña inválida
    cy.get('input[name="usuario"]').type(validUser);
    cy.get('input[type="password"]').type(invalidPassword);
    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // Resultado esperado: Solo se requiere que la alerta de error exista y sea visible
    cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');
  });

  it('CP-F1-002-03: Inicio de sesión con usuario y contraseña inválidos', () => {
    cy.get('input[name="usuario"]').type(invalidUser);
    cy.get('input[type="password"]').type(invalidPassword);
    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // Resultado esperado: Solo se requiere que la alerta de error exista y sea visible
    cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');
  });

  it('CP-F1-002-04: Inicio de sesión con usuario y contraseña vacíos', () => {
    // Clic directo en el botón sin escribir nada
    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // Resultado esperado: Solo se requiere que la alerta de error exista y sea visible
    cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');
  });

  it('CP-F1-002-05: Inicio de sesión con error de conexión o validación no disponible', () => {

    // 1. SIMULAR LA FALLA DE RED (Mocking) con la ruta exacta de la API
    // Usamos '**/api/Login/Autentificar' para atrapar cualquier petición a ese endpoint
    cy.intercept('POST', '**/api/Login/Autentificar', {
      forceNetworkError: true
    }).as('fallaDeConexion');

    // 2. INGRESAR CREDENCIALES
    cy.get('input[name="usuario"]').clear().type(validUser);
    cy.get('input[type="password"]').clear().type(validPassword);

    // 3. EJECUTAR LA ACCIÓN
    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // 4. SINCRONIZAR LA PRUEBA
    // Ahora Cypress sí encontrará esta petición porque la ruta coincide perfectamente
    cy.wait('@fallaDeConexion');

    // 5. VALIDAR EL COMPORTAMIENTO DE LA INTERFAZ
    cy.get('.alert-box.error #alert-message')
      .should('be.visible')
      .invoke('text')
      .should('match', /no es posible validar las credenciales en ese momento|error de conexi[oó]n/i);
  });

  it('CP-F1-002-06: Nuevo intento después de credenciales incorrectas', () => {
    // 1. Provocar un error intencionalmente
    cy.get('input[name="usuario"]').type(invalidUser);
    cy.get('input[type="password"]').type(validPassword);

    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // Validamos que ocurrió el error inicial
    cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');

    // 2. Realizar un nuevo intento
    // Vaciamos los campos de forma explícita para evitar arrastrar el usuario inválido.
    cy.get('input[name="usuario"]').invoke('val', '').trigger('input').should('have.value', '');
    cy.get('input[type="password"]').invoke('val', '').trigger('input').should('have.value', '');

    cy.get('input[name="usuario"]').type(validUser);
    cy.get('input[type="password"]').type(validPassword);

    cy.contains('button', /iniciar sesi[oó]n|ingresar/i).click();

    // 3. Resultado esperado
    cy.url().should('not.include', '/login');
  });



});