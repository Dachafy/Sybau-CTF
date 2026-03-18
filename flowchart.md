# Web Process Flowchart

This document simulates how this web app moves from the end user, through Express, into session storage and the MySQL database.

## Components

- End User: person using the site in a browser
- Browser: sends `GET` and `POST` requests and stores the session cookie
- Express App: `app.js` bootstraps middleware, routes, and views
- Router: `routes/userRoutes.js` maps URLs to controllers
- Controller: `controllers/userController.js` validates input and controls business logic
- Model: `models/userModel.js` performs parameterized SQL queries
- Session Store: `express-mysql-session` stores session data in the `sessions` table
- Database: MySQL database with `users` and `sessions` tables

## 1. Application Startup Flow

```mermaid
flowchart TD
    A[Run node app.js] --> B[Load .env with dotenv]
    B --> C[Create Express app]
    C --> D[Load session config]
    D --> E[ensureDatabaseExists]
    E --> F[ensureSessionTableExists]
    F --> G[User.createTable]
    G --> H[Configure middleware]
    H --> I[Mount routes]
    I --> J[Start HTTP server on PORT_APP]
    E --> K[(MySQL database)]
    F --> K
    G --> K
```

## 2. High-Level Request Flow

```mermaid
flowchart LR
    U[End User] --> V[Browser]
    V --> W[Express App]
    W --> X[Session Middleware]
    X --> Y[Route Handler]
    Y --> Z[Controller]
    Z --> M[Model]
    M --> DB[(MySQL users table)]
    X --> SS[(MySQL sessions table)]
    Z --> T[EJS View or Redirect]
    T --> V
```

## 3. Signup Flow

```mermaid
flowchart TD
    A[User opens /signup] --> B[GET /signup]
    B --> C[isGuest middleware]
    C -->|Not logged in| D[getCreateUser controller]
    D --> E[Render signup form]

    E --> F[User submits signup form]
    F --> G[POST /signup]
    G --> H[isGuest middleware]
    H --> I[createUser controller]
    I --> J[Validate required fields, email, password length, confirm password]
    J -->|Invalid| K[Render signup page with error]
    J -->|Valid| L[User.findByEmail]
    L --> M[(MySQL users table)]
    M --> N{Email exists?}
    N -->|Yes| O[Render signup page with duplicate email error]
    N -->|No| P[Hash password with bcrypt]
    P --> Q[User.save]
    Q --> M
    M --> R[User.findById]
    R --> M
    R --> S[regenerateSession]
    S --> T[Save user info in req.session]
    T --> U[Save session]
    U --> V[(MySQL sessions table)]
    U --> W[303 Redirect to /dashboard]
    W --> X[Browser stores session cookie]
```

## 4. Login Flow

```mermaid
flowchart TD
    A[User opens /login] --> B[GET /login]
    B --> C[isGuest middleware]
    C --> D[Render login page]

    D --> E[User submits login form]
    E --> F[POST /login]
    F --> G[isGuest middleware]
    G --> H[loginUser controller]
    H --> I[Validate email and password presence]
    I -->|Invalid| J[Render login page with error]
    I -->|Valid| K[User.findByEmail]
    K --> L[(MySQL users table)]
    L --> M{User found?}
    M -->|No| N[Render invalid credentials]
    M -->|Yes| O[Compare password with bcrypt.compare]
    O --> P{Password matches?}
    P -->|No| Q[Render invalid credentials]
    P -->|Yes| R[regenerateSession]
    R --> S[Save user info in req.session]
    S --> T[Save session]
    T --> U[(MySQL sessions table)]
    T --> V[303 Redirect to /dashboard]
    V --> W[Browser sends session cookie on next request]
```

## 5. Dashboard and Search Flow

```mermaid
flowchart TD
    A[User opens /dashboard] --> B[GET /dashboard]
    B --> C[isAuth middleware]
    C -->|No session| D[Redirect to /login]
    C -->|Session exists| E[listUser controller]
    E --> F{search query exists?}
    F -->|No| G[User.fetchAll]
    F -->|Yes| H[User.findUser]
    G --> I[(MySQL users table)]
    H --> I
    I --> J[Return rows to controller]
    J --> K[Render users/list.ejs]
    K --> L[Browser shows dashboard table]
```

## 6. Logout Flow

```mermaid
flowchart TD
    A[User clicks Logout] --> B[POST /logout]
    B --> C[isAuth middleware]
    C --> D[logoutUser controller]
    D --> E[Destroy req.session]
    E --> F[(MySQL sessions table)]
    E --> G[Clear cookie in browser]
    G --> H[303 Redirect to /login]
```

## 7. End-to-End Sequence

```mermaid
sequenceDiagram
    actor U as End User
    participant B as Browser
    participant E as Express App
    participant R as Router
    participant C as Controller
    participant S as Session Store
    participant M as User Model
    participant DB as MySQL

    U->>B: Open signup page
    B->>E: GET /signup
    E->>R: Match route
    R->>C: getCreateUser
    C-->>B: Render signup form

    U->>B: Submit signup form
    B->>E: POST /signup
    E->>R: Match route
    R->>C: createUser
    C->>M: findByEmail(email)
    M->>DB: SELECT user by email
    DB-->>M: rows
    M-->>C: result
    C->>C: bcrypt.hash(password)
    C->>M: save(user)
    M->>DB: INSERT INTO users
    DB-->>M: insertId
    M-->>C: inserted user id
    C->>S: regenerate and save session
    S->>DB: INSERT/UPDATE sessions
    DB-->>S: session stored
    C-->>B: 303 redirect to /dashboard + Set-Cookie

    B->>E: GET /dashboard with cookie
    E->>S: Load session from cookie id
    S->>DB: SELECT session
    DB-->>S: session data
    E->>R: Match route
    R->>C: listUser
    C->>M: fetchAll()
    M->>DB: SELECT users
    DB-->>M: user rows
    M-->>C: result
    C-->>B: Render dashboard
```

## Notes

- Passwords are never stored in plain text. They are hashed with `bcrypt`.
- Session state is not only in the browser cookie. The cookie stores the session id, while session data lives in MySQL.
- `isGuest` blocks logged-in users from visiting signup and login pages.
- `isAuth` blocks guests from visiting the dashboard and logout route.
- User reads and searches are parameterized in the model before reaching MySQL.
