# API - Pizza 
v1.0 - Quentin MENDEL, Thomas DUBUIS
## Description

API proposant diverses options avec comme thème principal les pizzas
<!-- ## Information  -->
### Install

```bash
    npm install
```
Créer la base de données : 'database_pizza' puis effectué les migrations:

```bash
    npm run migrate
```
### Run

Developpement : 

```bash
    npm run dev
```
Production :

```bash
    npm start
```
## Routes

Pour accéder and modifier les ressources, vous pouvez utiliser les méthodes HTTP suivantes : 
**GET**  **POST**  **PUT**  **PATCH**  **DELETE**  **OPTIONS**

### Reponse Générique

Succès :
```bash 
    return {
        success: true,
        message: message,
        body: body,
    };
```

Erreur :

```bash
    return {
      success: false,
      error: error,
      body: body,
    };
```
### User

Administrateur :

```bash
    - delete("/deleteUser/:id")

    - get("/getUsers")

    - get("/getUser/:id")
```

Utilisateur : 

```bash
    - post("/register")

    - post("/login")

    - get("/profile")

    - put("/profile")

    - put("/updatePassword")

    - delete("/profile")

    - post("/requestEmailPassword")

    - put("/resetPassword/:token")
```
### Ingrédient

Administrateur :

```bash 
    - post("/createIngredient")

    - delete("/deleteIngredient/:id")

    - put("/updateIngredient/:id")
```
Utilisateur : 

```bash
    - get("/getIngredients")

    - get("/getIngredient/:id")
```
### Pizza

Administrateur : 

```bash
    - put("/updatePizza/:id")

    - delete("/deletePizza/:id")
```

Utilisateur : 

```bash
    - get("/getPizzas")

    - get("/getImagePizza/:image")

    - post("/createPizza")

    -get ("/getPizza/:id")
```
### Order

Administrateur : 

```bash
    - get("/getOrder/:id")

    - get("/getOrders")

    - get("/getUserOrders/:id")

    - delete("/deleteOrder/:id")
```

Utilisateur : 

```bash
    - post('/createOrder')

    - get('/myOrders')

    - get("/getMyOrder/:id")

    - put("/updateOrder/:id")

    - delete("/deleteMyOrder/:id")
```
