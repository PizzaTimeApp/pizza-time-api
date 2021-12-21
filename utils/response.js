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
};
