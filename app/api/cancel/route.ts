// app/api/cancel/route.ts
import { getSoapClient } from '@/lib/soap-client';
import { NextResponse, NextRequest } from 'next/server';

// Interfaces for request and SOAP CancelLastReg response
interface CancelRequestBody {
  garNum: string;
  phone: string;
}

interface SoapCancelLastRegResponse {
  CancelLastRegResult?: string;
  [key: string]: unknown;
}

interface SoapResultField {
  return?: string;
  [key: string]: unknown;
}

interface ParsedCancelResult {
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
  let body: CancelRequestBody;

  try {
    body = (await request.json()) as CancelRequestBody;
  } catch (e: unknown) {
    console.error('/cancel', e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: corsHeaders });
  }

  const { garNum, phone } = body;
  if (!garNum || !phone) {
    return NextResponse.json({ error: 'Missing garageNumber or phone' }, { status: 400, headers: corsHeaders });
  }

  // Call SOAP CancelLastReg
  let soapResponse: SoapCancelLastRegResponse;
  try {
    const client = await getSoapClient();
    const rawPayload = JSON.stringify({ GarNomer: garNum, Telephone: phone });

    soapResponse = await new Promise<SoapCancelLastRegResponse>((resolve, reject) => {
      client.CancelLastReg({ СтрокаJSON: rawPayload }, (err: unknown, result: unknown) => {
        if (err) {
          return reject(err);
        }
        resolve(result as SoapCancelLastRegResponse);
      });
    });
  } catch (error: unknown) {
    console.error('SOAP CancelLastReg error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }

  // Extract and parse result
  const resultField = soapResponse.CancelLastRegResult
    ? JSON.parse(soapResponse.CancelLastRegResult)
    : (soapResponse as SoapResultField);

  let parsed: ParsedCancelResult;
  try {
    if (typeof resultField.return === 'string') {
      parsed = JSON.parse(resultField.return);
    } else {
      parsed = resultField as ParsedCancelResult;
    }
  } catch (error: unknown) {
    console.error('Error parsing CancelLastReg response:', error);
    return NextResponse.json({ error: 'Invalid SOAP response format' }, { status: 500, headers: corsHeaders });
  }

  // Handle service errors
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
  }

  console.log('Cancellation successful:', parsed.data);
  return NextResponse.json(parsed.data, { status: 200, headers: corsHeaders });
}
