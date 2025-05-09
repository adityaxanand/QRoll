
'use server';

/**
 * @fileOverview Verifies a student's identity using facial recognition by calling a dedicated backend service.
 *
 * - verifyStudentFace - A function that handles the face verification process.
 * - VerifyStudentFaceInput - The input type for the verifyStudentFace function.
 * - VerifyStudentFaceOutput - The return type for the verifyStudentFace function.
 */

import {ai} from '@/ai/genkit'; 
import {z} from 'genkit/zod'; 

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL;

// Input schema for the backend call
const VerifyStudentFaceInputSchema = z.object({
  studentId: z.string().describe("The MongoDB _id of the student."),
  capturedFaceDataUri: z
    .string()
    .describe(
      "A photo of the student's face captured from the webcam, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VerifyStudentFaceInput = z.infer<typeof VerifyStudentFaceInputSchema>;

// Output schema expected from the backend
const VerifyStudentFaceOutputSchema = z.object({
  isMatch: z.boolean().describe('Whether the captured face matches the student profile.'),
  confidence: z.number().describe('The confidence level of the face match (0-1).'),
  distance: z.number().optional().describe('The distance metric from face comparison (lower is better).'), 
});
export type VerifyStudentFaceOutput = z.infer<typeof VerifyStudentFaceOutputSchema>;


// This function is called by the frontend component.
// It wraps the call to the Genkit flow (which then calls the backend).
export async function verifyStudentFace(input: VerifyStudentFaceInput): Promise<VerifyStudentFaceOutput> {
  // Directly call the backend wrapper function, no need for Genkit flow if it's just an API call.
  // However, if Genkit tracing/observability is desired for this operation, a flow can be defined.
  // For simplicity now, directly call the backend wrapper logic.
  
  if (!BACKEND_API_URL) {
    console.error("Backend API URL is not configured for verifyStudentFace.");
    // throw new Error("Backend API URL is not configured.");
     return { isMatch: false, confidence: 0, distance: undefined }; // Consistent error response
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/verify-face`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header might be needed if the backend endpoint is protected
        // and studentId is not sufficient for identifying the user for verification.
        // If studentId is derived from an auth token on backend, then frontend token is needed.
        // If studentId is passed directly, backend must ensure it's a valid operation.
      },
      body: JSON.stringify({
        userId: input.studentId, // Backend expects 'userId'
        faceImage: input.capturedFaceDataUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Backend verification failed with status: ${response.status}` }));
      console.error("Backend face verification error:", errorData.message);
      // throw new Error(errorData.message || `Backend verification failed with status: ${response.status}`);
      return { isMatch: false, confidence: 0, distance: undefined, /* message: errorData.message */ };
    }

    const result = await response.json();
    return VerifyStudentFaceOutputSchema.parse(result); // Validate backend response

  } catch (error: any) {
    console.error("Error calling backend face verification from flow/wrapper:", error);
    return {
      isMatch: false,
      confidence: 0,
      distance: undefined,
      // message: error.message || "Failed to connect to verification service",
    };
  }
}

// Optional: Define as a Genkit flow for tracing if needed, though the above direct call is simpler.
/*
const verifyStudentFaceViaApiFlow = ai.defineFlow(
  {
    name: 'verifyStudentFaceViaApiFlow',
    inputSchema: VerifyStudentFaceInputSchema,
    outputSchema: VerifyStudentFaceOutputSchema,
  },
  async (input) => {
    if (!BACKEND_API_URL) {
      throw new Error("Backend API URL is not configured.");
    }
    const response = await fetch(`${BACKEND_API_URL}/auth/verify-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: input.studentId, faceImage: input.capturedFaceDataUri }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Backend verification failed: ${response.status}` }));
      throw new Error(errorData.message || `Backend verification failed: ${response.status}`);
    }
    const result = await response.json();
    return VerifyStudentFaceOutputSchema.parse(result);
  }
);

export async function verifyStudentFace(input: VerifyStudentFaceInput): Promise<VerifyStudentFaceOutput> {
  try {
    return await verifyStudentFaceViaApiFlow(input);
  } catch (error: any) {
     console.error("Error in verifyStudentFace Genkit flow:", error);
     return { isMatch: false, confidence: 0, distance: undefined }; // Fallback error structure
  }
}
*/
