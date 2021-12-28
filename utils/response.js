module.exports = {
  /**
   * @param {String} message - The message
   * @param {JSON} body - The Json (optional)
   * @returns {JSON}
   */
  responseOK: function (message, body) {
    if (body) {
      return {
        success: true,
        message: message,
        body: body,
      };
    } else {
      return {
        success: true,
        message: message,
      };
    }
  },

  /**
   * @param {String} error - The error message
   * @param {JSON} body - The Json (optional)
   * @returns {JSON}
   */
  responseERROR: function (error, body) {
    return {
      success: false,
      error: error,
      body: body,
    };
  },
  errorType: Object.freeze({
    NO_ADMIN: "No Admin",
    WRONG_TOKEN: "Wrong Token",
    INVALID_FIELDS: "Invalid fields",
    INGREDIENT: Object.freeze({
      NOT_FOUND: "Ingredient not found",
      UNABLE_TO_VERIFY: "Unable to verify ingredient",
      EXIST: "Ingredient already exist",
      NOEXIST:"Ingredient not exist",
      CANT_CREATE : "Cannot create ingredient",
      CANT_DELETE: "Cannot delete ingredient",
      CANT_UPDATE: "Cannot update ingredient"
    }),
    USER: Object.freeze({
      NOT_FOUND: "User not found",
      UNABLE_TO_VERIFY: "Unable to verify user",
      UNABLE_TO_VERIFY_EMAIL: "unable to verify user email",
      EXIST: "User already exist",
      NOEXIST: "User not exist in DB",
      CANT_CREATE : "Cannot create user",
      CANT_DELETE: "Cannot delete user",
      CANT_UPDATE: "Cannot update user",
      WRONG_USERNAME: "Wrong username (must be length 3 - 17)",
      WRONG_EMAIL: "Email is not valid",
      WRONG_PASSWORD: "Password invalid (must lenght 4 - 30 and include 1 number at least)",
      DIFFERENT_PASSWORD: "Passwords must match",
      WRONG_GENDER: "Gender is not valid",
      WRONG_ZIP: "Zip is not valid, must be 5 numbers",
      WRONG_DATEOFBIRTH: "Date of birth is not valid, format YYYY-MM-DD",
      WRONG_PHONE: "Phone is not valid, only number accepted",
      INVALID_PASSWORD: "Invalid password",
      CANT_UPDATE_PASSWORD: "Cannot update user passsword",
      EMAIL_NOEXIST: "User email not exist in DB",
      CANT_ADD_PASSWORD_REQUEST: "Cannot add user reset password request",
      CANT_SEND_PASSWORD_REQUEST: "Cannot send reset password email",
      CANT_RESET_PASSWORD: "Cannot reset user password"
    }),
    PIZZA_INGREDIENT:Object.freeze({
      NOT_FOUND: "PizzaIngredient not found",
      UNABLE_TO_VERIFY: "Unable to verify pizzaIngredient",
      EXIST: "PizzaIngredient already exist",
      NOEXIST: "PizzaIngredient not exist",
      CANT_CREATE : "Cannot create pizzaIngredient",
      CANT_DELETE: "Cannot delete pizzaIngredient",
      CANT_UPDATE: "Cannot update pizzaIngredient"
    }),
    PIZZA: Object.freeze({
      NOT_FOUND: "Pizza not found",
      UNABLE_TO_VERIFY: "Unable to verify pizza",
      EXIST: "Pizza already exist",
      NOEXIST: "Pizza not exist",
      CANT_CREATE : "Cannot create pizza",
      CANT_DELETE: "Cannot delete pizza",
      CANT_UPDATE: "Cannot update pizza"
    }),
  }),
};
