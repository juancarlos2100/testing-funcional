describe('Flujo 1 - Inicio de Sesión Stream RTC', () => {

    let loginUrl;
    let validUser;
    let validPassword;

    before(() => {
        cy.env(['LOGIN_URL', 'VALID_USER', 'VALID_PASSWORD'])
            .then((env) => {
                loginUrl = env.LOGIN_URL;
                validUser = env.VALID_USER;
                validPassword = env.VALID_PASSWORD;

                if (!loginUrl || !validUser || !validPassword) {
                    throw new Error('Missing one or more required Cypress env values');
                }
            });
    });

    beforeEach(() => {
        // Precondición general: El sistema web está disponible y el usuario no tiene sesión.
        cy.visit(loginUrl);
    });

    it('CP-F1-001: Visualizar pantalla de inicio de sesión al acceder al sistema', () => {
        cy.url().should('include', '/login');

        // Verificamos que los 3 elementos principales existan en el DOM
        cy.get('input[name="usuario"]').should('exist');
        cy.get('input[type="password"]').should('exist');
        // Usamos una expresión regular para buscar el botón sin importar si dice "Iniciar sesión" o "Ingresar"
        cy.contains('button', /iniciar sesi[oó]n|ingresar/i).should('exist');
    });

    it('CP-F1-002: Validar presencia de componentes del formulario de login', () => {
        // Validar el campo Usuario (visible y editable)
        cy.get('input[name="usuario"]')
            .should('be.visible')
            .and('not.be.disabled');

        // Validar el campo Contraseña (visible y editable)
        cy.get('input[type="password"]')
            .should('be.visible')
            .and('not.be.disabled');

        // Validar el botón de inicio de sesión (visible y habilitado)
        cy.contains('button', /iniciar sesi[oó]n|ingresar/i)
            .should('be.visible')
            .and('not.be.disabled');
    });

    it('CP-F1-003: Capturar usuario válido', () => {
        cy.get('input[name="usuario"]')
            .click()
            .type(validUser)
            // Validamos que el sistema permita capturar el identificador correctamente
            .should('have.value', validUser);
    });

    it('CP-F1-004: Capturar contraseña válida con caracteres ocultos', () => {
        cy.get('input[type="password"]')
            .click()
            .type(validPassword)
            // Validamos que el sistema oculta visualmente los caracteres ingresados
            .should('have.attr', 'type', 'password')
            .and('have.value', validPassword);
    });

    it('CP-F1-005: Ejecutar inicio de sesión con credenciales válidas', () => {
        cy.login(validUser, validPassword);

        // Validamos el acceso exitoso (por ejemplo, confirmando que la URL cambió al dashboard)
        cy.url().should('not.include', '/login');
    });

    it('CP-F1-006: Visualización de información principal después del login', () => {
        // 1. Realizar login exitoso
        cy.login(validUser, validPassword);

        // 2. Observar encabezado principal
        cy.get('.header-bar').should('be.visible');

        // Validamos el nombre del sistema dentro del header
        cy.get('.header-bar').contains(/Streams - SCPCDMX/i).should('be.visible');

        // 3. Validamos que .header-brand-sub se encuentre DENTRO de .header-bar y sea visible.
        // El comando .find() restringe la búsqueda solo a los hijos del elemento anterior.
        cy.get('.header-bar')
            .find('.header-brand-sub')
            .should('be.visible');

        // Validar la versión de la aplicación
        cy.get('.header-bar').contains(/v\d+\.\d+/i).should('be.visible');
    });

    it('CP-F1-007: Carga inicial del tablero', () => {
        // 1. Iniciar sesión
        cy.login(validUser, validPassword);

        // 2. Esperar carga del tablero y validar que se muestra sin errores
        // Podrías validar la visibilidad de la etiqueta principal, un panel lateral, un mapa, etc.
        cy.get('main').should('be.visible');

        // Validar de forma genérica que no existan alertas de error críticas en la vista
        cy.contains(/error interno|fallo en la carga|500/i).should('not.exist');

    });

    it('CP-F1-008: Acceso directo a una página protegida sin autenticación', () => {
        // 1. Intentar acceder directamente a una URL interna del sistema
        // (Ajusta '/admin/' por la ruta protegida real de tu sistema, como '/home', '/dashboard', etc.)
        cy.visit('https://scpcdmxserverwebrtc.azurewebsites.net/admin/');

        // 2. El resultado esperado: El sistema impide el acceso y solicita autenticación
        // Validamos que la URL haya sido redirigida forzosamente a la pantalla de login
        cy.url().should('include', '/login');

        // 3. Validamos que el formulario de autenticación esté visible en pantalla
        cy.get('input[name="usuario"]').should('be.visible');
        cy.get('input[type="password"]').should('be.visible');
    });



});