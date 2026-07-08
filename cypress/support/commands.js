const LOGIN_BUTTON_REGEX = /iniciar sesi[oó]n|ingresar/i;

Cypress.Commands.add('fillLoginForm', (username, password) => {
	cy.get('input[name="usuario"]').clear().type(username);
	cy.get('input[type="password"]').clear().type(password);
});

Cypress.Commands.add('submitLogin', () => {
	cy.contains('button', LOGIN_BUTTON_REGEX).click();
});

Cypress.Commands.add('login', (username, password) => {
	cy.fillLoginForm(username, password);
	cy.submitLogin();
});

Cypress.Commands.add('assertLoginErrorVisible', () => {
	cy.get('.alert-box.error #alert-message').should('exist').and('be.visible');
});
