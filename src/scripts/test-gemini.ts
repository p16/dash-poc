/**
 * Gemini API Integration Test Script
 *
 * Tests connection to Google Gemini API with a basic query.
 * Run manually with: npx tsx src/scripts/test-gemini.ts
 *
 * Requires: GEMINI_API_KEY environment variable
 */

import dotenv from 'dotenv';
import { queryGemini, queryGeminiJson, validateApiKey } from '../lib/llm/gemini';
import { logger } from '../lib/utils/logger';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGeminiConnection() {
  console.log('=== Gemini API Integration Test ===\n');

  try {
    // Test 1: Validate API key
    console.log('Test 1: Validating API key...');
    validateApiKey();
    console.log('✓ API key validation successful\n');

    // Test 2: Basic text query
    console.log('Test 2: Sending basic text query...');
    const textPrompt = 'Respond with exactly: "Hello from Gemini!"';
    const textResponse = await queryGemini(textPrompt);
    console.log('Response:', textResponse);
    console.log('✓ Basic text query successful\n');

    // Test 3: JSON query
    console.log('Test 3: Sending JSON query...');
    const jsonPrompt = `Generate a JSON object with the following structure:
{
  "status": "success",
  "message": "Hello from Gemini JSON mode",
  "timestamp": "<current date/time>",
  "test": true
}`;
    const jsonResponse = await queryGeminiJson(jsonPrompt);
    console.log('JSON Response:', JSON.stringify(jsonResponse, null, 2));
    console.log('✓ JSON query successful\n');

    // Test 4: Response parsing
    console.log('Test 4: Testing response parsing...');
    const parsedJson = JSON.parse(JSON.stringify(jsonResponse));
    console.log('Parsed successfully. Keys:', Object.keys(parsedJson));
    console.log('✓ Response parsing successful\n');

    console.log('=== All Tests Passed ===');
    console.log('\nGemini API integration is working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run tests
testGeminiConnection();
