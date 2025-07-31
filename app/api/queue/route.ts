// app/api/queue/route.ts
import { getSoapClient } from '@/lib/soap-client';
import { NextResponse, NextRequest } from 'next/server';

// Interfaces for request and SOAP GetInLine response
interface QueueRequestBody {
  garNum: string;
  phone: string;
  regTime: string;
}

interface SoapGetInLineResponse {
  GetInLineResult?: string;
  [key: string]: unknown;
}

interface SoapResultField {
  return?: string;
  [key: string]: unknown;
}

interface ParsedQueueResult {
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
  let body: QueueRequestBody;

  try {
    body = (await request.json()) as QueueRequestBody;
  } catch (e: unknown) {
    console.error(e);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400, headers: corsHeaders });
  }

  const { garNum, phone, regTime } = body;
  if (!garNum || !phone || !regTime) {
    return NextResponse.json(
      { error: 'Missing garageNumber, phone, or regTime' },
      { status: 400, headers: corsHeaders }
    );
  }

  // Call SOAP GetInLine
  let soapResponse: SoapGetInLineResponse;
  try {
    const client = await getSoapClient();
    const rawPayload = JSON.stringify({ GarNomer: garNum, Telephone: phone, RegTime: regTime });

    soapResponse = await new Promise<SoapGetInLineResponse>((resolve, reject) => {
      client.GetInLine({ СтрокаJSON: rawPayload }, (err: unknown, result: unknown) => {
        if (err) {
          return reject(err);
        }
        resolve(result as SoapGetInLineResponse);
      });
    });
  } catch (error: unknown) {
    console.error('SOAP GetInLine error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }

  // Extract and parse result
  const resultField = soapResponse.GetInLineResult
    ? JSON.parse(soapResponse.GetInLineResult)
    : (soapResponse as SoapResultField);

  let parsed: ParsedQueueResult;
  try {
    if (typeof resultField.return === 'string') {
      parsed = JSON.parse(resultField.return);
    } else {
      parsed = resultField as ParsedQueueResult;
    }
  } catch (error: unknown) {
    console.error('Error parsing GetInLine response:', error);
    return NextResponse.json({ error: 'Invalid SOAP response format' }, { status: 500, headers: corsHeaders });
  }

  // Handle service errors
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400, headers: corsHeaders });
  }

  console.log('Queue registration successful:', parsed.data);
  return NextResponse.json(parsed.data, { status: 200, headers: corsHeaders });
}
