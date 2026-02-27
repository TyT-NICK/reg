// app/api/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSoapClient } from '@/lib/soap-client';
import { AuthRequestBody } from '../auth/route';

// Interfaces for SOAP NextRegTime response
interface SoapNextRegTimeResponse {
  NextRegTimeResult?: string;
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
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  // Call SOAP NextRegTime
  let soapResponse: SoapNextRegTimeResponse;

  try {
    const body = (await request.json()) as AuthRequestBody;

    const { garageNumber, phone } = body;
    if (!garageNumber || !phone) {
      return NextResponse.json(
        { error: 'Missing garageNumber or phone' },
        { status: 400, headers: corsHeaders },
      );
    }

    const rawPayload = JSON.stringify({
      GarNomer: garageNumber,
      Telephone: phone,
    });

    const client = await getSoapClient();
    soapResponse = await new Promise<SoapNextRegTimeResponse>(
      (resolve, reject) => {
        client.NextRegTime(
          { СтрокаJSON: rawPayload },
          (err: unknown, result: unknown) => {
            if (err) {
              return reject(err);
            }
            resolve(result as SoapNextRegTimeResponse);
          },
        );
      },
    );
  } catch (error: unknown) {
    console.error('SOAP NextRegTime error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders },
    );
  }

  // Extract and parse result
  const resultField = soapResponse.NextRegTimeResult
    ? JSON.parse(soapResponse.NextRegTimeResult)
    : (soapResponse as SoapResultField);

  let parsed: ParsedAuthResult;
  try {
    if (typeof resultField.return === 'string') {
      parsed = JSON.parse(resultField.return);
    } else {
      parsed = resultField as ParsedAuthResult;
    }
  } catch (error: unknown) {
    console.error('Error parsing NextRegTime response:', error);
    return NextResponse.json(
      { error: 'Invalid SOAP response format' },
      { status: 500, headers: corsHeaders },
    );
  }

  // Handle service errors
  if (parsed.error) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400, headers: corsHeaders },
    );
  }

  console.log('Next available registration time:', parsed.data);
  return NextResponse.json(parsed.data, { status: 200, headers: corsHeaders });
}
