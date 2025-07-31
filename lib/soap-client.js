import * as soap from 'soap';

// WSDL URL from environment variable
const wsdlUrl = process.env.WSDL_URL;

const login = process.env.WSDL_LOGIN;
const password = process.env.WSDL_PASSWORD;

// Optional SOAP client options
const soapOptions = {
  wsdl_options: {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64'),
    },
  },
};

let cachedClient = null;

export async function getSoapClient() {
  if (cachedClient) {
    return cachedClient;
  }
  if (!wsdlUrl) {
    throw new Error('Missing SOAP_WSDL_URL in environment');
  }

  const client = await soap.createClientAsync(wsdlUrl, soapOptions);

  client.setSecurity(new soap.BasicAuthSecurity(login, password));
  cachedClient = client;
  return client;
}
