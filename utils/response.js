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
      NOEXIST: "Ingredient already exist",
      CANT_CREATE : "Cannot create ingredient",
      CANT_DELETE: "Cannot delete ingredient",
      CANT_UPDATE: "Cannot update ingredient"
    }),
  }),
};
