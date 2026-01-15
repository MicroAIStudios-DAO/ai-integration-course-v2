import { onCall, HttpsError } from "firebase-functions/v2/https";
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

const PROJECT_ID = "ai-integra-course-v2";
const SITE_KEY = "6LfdjDosAAAAANnRKcsZQSQLGYVA188hLY_O_naP";
// Minimum score threshold (0.0 to 1.0, higher is more likely human)
const MIN_SCORE_THRESHOLD = 0.5;

interface VerifyRecaptchaData {
  token: string;
  action: string;
}

interface VerifyRecaptchaResponse {
  success: boolean;
  score: number | null;
  action: string | null;
  reasons: string[];
  error?: string;
}

/**
 * Verifies a reCAPTCHA Enterprise token and returns the assessment results.
 *
 * Usage from frontend:
 * ```
 * import { getFunctions, httpsCallable } from 'firebase/functions';
 * const functions = getFunctions();
 * const verifyRecaptcha = httpsCallable(functions, 'verifyRecaptcha');
 * const result = await verifyRecaptcha({ token, action: 'LOGIN' });
 * ```
 */
export const verifyRecaptcha = onCall(
  { maxInstances: 10 },
  async (request): Promise<VerifyRecaptchaResponse> => {
    const data = request.data as VerifyRecaptchaData;
    const { token, action } = data;

    if (!token) {
      throw new HttpsError("invalid-argument", "Missing reCAPTCHA token");
    }

    if (!action) {
      throw new HttpsError("invalid-argument", "Missing action parameter");
    }

    try {
      const client = new RecaptchaEnterpriseServiceClient();
      const projectPath = client.projectPath(PROJECT_ID);

      const [response] = await client.createAssessment({
        parent: projectPath,
        assessment: {
          event: {
            token: token,
            siteKey: SITE_KEY,
            expectedAction: action,
          },
        },
      });

      // Check if the token is valid
      if (!response.tokenProperties?.valid) {
        const invalidReason = response.tokenProperties?.invalidReason || "UNKNOWN";
        console.warn(`Invalid reCAPTCHA token: ${invalidReason}`);
        return {
          success: false,
          score: null,
          action: null,
          reasons: [`Invalid token: ${invalidReason}`],
        };
      }

      // Check if the action matches
      if (response.tokenProperties?.action !== action) {
        console.warn(
          `Action mismatch: expected ${action}, got ${response.tokenProperties?.action}`
        );
        return {
          success: false,
          score: response.riskAnalysis?.score || null,
          action: response.tokenProperties?.action || null,
          reasons: ["Action mismatch"],
        };
      }

      const score = response.riskAnalysis?.score || 0;
      const reasons = (response.riskAnalysis?.reasons || []).map(r => String(r));

      // Log for monitoring
      console.log(`reCAPTCHA assessment: action=${action}, score=${score}`);

      return {
        success: score >= MIN_SCORE_THRESHOLD,
        score: score,
        action: response.tokenProperties?.action || null,
        reasons: reasons,
      };
    } catch (error) {
      console.error("reCAPTCHA verification error:", error);
      throw new HttpsError(
        "internal",
        "Failed to verify reCAPTCHA token"
      );
    }
  }
);
