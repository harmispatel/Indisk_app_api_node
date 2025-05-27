const axios = require("axios");

const createVivaOrder = async (amount, description, reference) => {
  try {
    const clientId =
      "ur8a0rsy8ts6jq2tnor8vtsgmgsickzy74gppffuzt406.apps.vivapayments.com";
    const clientSecret = "3iDY998WjfXkBv8FXGEi70Cu7RHteR";
    const authUrl = "https://demo-accounts.vivapayments.com";
    const apiUrl = "https://demo-api.vivapayments.com";
    const checkoutBase = "https://demo.vivapayments.com";

    // Get access token
    const tokenResponse = await axios.post(
      `${authUrl}/connect/token`,
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "vivaWalletApi",
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

    // Create Viva order
    const orderResponse = await axios.post(
      `${apiUrl}/api/orders`,
      {
        amount,
        customerTrns: description,
        merchantTrns: reference,
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
      checkoutUrl: `${checkoutBase}/web/checkout?ref=${orderCode}`,
      orderCode,
    };
  }catch (error) {
  console.error("Viva Wallet API error:", {
    status: error.response?.status,
    data: error.response?.data,
    headers: error.response?.headers,
    message: error.message,
  });
  throw new Error("Failed to create Viva Wallet order");
}
};

module.exports = { createVivaOrder };
