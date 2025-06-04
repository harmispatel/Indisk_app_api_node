const axios = require("axios");

const createVivaOrder = async (amount, description, reference) => {
  try {
    const clientId =
      "ur8a0rsy8ts6jq2tnor8vtsgmgsickzy74gppffuzt406.apps.vivapayments.com";
    const clientSecret = "oXTYAtjB40y8TCqBe70g2qEad4igsB";

    const tokenResponse = await axios.post(
      "https://demo-accounts.vivapayments.com/connect/token",
      new URLSearchParams({
        grant_type: "client_credentials",
      }).toString(),
      {
        auth: {
          username: clientId,
          password: clientSecret,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const accessToken = tokenResponse.data.access_token;

    const orderResponse = await axios.post(
      "https://demo-api.vivapayments.com/checkout/v2/orders",
      {
        amount: 1000,
        customerTrns: description,
        reference,
        successUrl: "https://indisk-app.harmistechnology.com/payment-success",
        failureUrl: "https://indisk-app.harmistechnology.com/payment-failure",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const orderCode = orderResponse.data.orderCode;

    return {
      checkoutUrl: `https://demo.vivapayments.com/web/checkout?ref=${orderCode}`,
      orderCode,
    };
  } catch (error) {
    console.error("Viva Wallet API error:", {
      config: error.config,
      request: error.request,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      message: error.message,
    });
    throw new Error("Failed to create Viva Wallet order");
  }
};

module.exports = { createVivaOrder };
