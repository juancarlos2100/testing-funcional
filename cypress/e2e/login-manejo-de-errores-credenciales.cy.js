describe('Flujos Alternativos y Excepciones - Inicio de Sesión Stream RTC', () => {

  // Definición de datos de prueba positivos y negativos
  const validUser = 'root';
  const validPassword = '1234';
  const invalidUser = 'prueba_invalida_123';
  const invalidPassword = 'password_falsa_123';

  beforeEach(() => {
    // Precondición: El usuario se encuentra en la pantalla de inicio de sesión
    cy.visit('https://scpcdmxserverwebrtc.azurewebsites.net/login');
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

  it('CP-F1-002-05: Nuevo intento después de credenciales incorrectas', () => {
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