// app/api/getAvailable/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getSoapClient } from '@/lib/soap-client';

// Interfaces for request and SOAP response
export interface AuthRequestBody {
  garageNumber: string;
  phone: string;
}

interface SoapAuthorizationResponse {
  AuthorizationResult?: string;
  [key: string]: unknown;
}

interface SoapResultField {
  return?: string;
  [key: string]: unknown;
}

interface ParsedAuthResult {
  error?: string;
  data?: unknown;
}

// Shared CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AuthRequestBody;
  console.log('🚀 ~ POST ~ body:', body);

  const { garageNumber, phone } = body;
  if (!garageNumber || !phone) {
    return NextResponse.json(
      { error: 'Missing garageNumber or phone' },
      { status: 400, headers: corsHeaders },
    );
  }

  // Call SOAP Authorization
  let soapResponse: SoapAuthorizationResponse;
  try {
    const client = await getSoapClient();
    const rawPayload = JSON.stringify({
      GarNomer: garageNumber,
      Telephone: phone,
    });

    soapResponse = await new Promise<SoapAuthorizationResponse>(
      (resolve, reject) => {
        client.Authorization(
          { СтрокаJSON: rawPayload },
          (err: unknown, result: unknown) => {
            if (err) {
              return reject(err);
            }
            resolve(result as SoapAuthorizationResponse);
          },
        );
      },
    );
  } catch (error) {
    console.error('SOAP Authorization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders },
    );
  }

  // Extract and parse result
  const resultField = soapResponse.AuthorizationResult
    ? JSON.parse(soapResponse.AuthorizationResult)
    : (soapResponse as SoapResultField);

  let parsed: ParsedAuthResult;
  try {
    parsed = resultField.return
      ? JSON.parse(resultField.return)
      : (resultField as ParsedAuthResult);
  } catch (error) {
    console.error('Error parsing SOAP result:', error);
    return NextResponse.json(
      { error: 'Invalid SOAP response format' },
      { status: 500, headers: corsHeaders },
    );
  }

  // Handle errors from the service
  if (parsed.error) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: corsHeaders },
    );
  }

  console.log('Auth successful:', parsed.data);
  return NextResponse.json(parsed.data, {
    status: 200,
    headers: corsHeaders,
  });
}
