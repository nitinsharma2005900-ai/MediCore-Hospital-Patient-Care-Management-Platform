import { FhirPatient, FhirAppointment, FhirEncounter, FhirObservation } from '@medicore/shared';

export interface FhirClientConfig {
  baseUrl: string;
  authToken?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

export class FhirClient {
  private config: Required<FhirClientConfig>;

  constructor(cfg: FhirClientConfig) {
    this.config = {
      baseUrl: cfg.baseUrl.replace(/\/$/, ''),
      authToken: cfg.authToken || 'medicore-fhir-dev-token',
      timeoutMs: cfg.timeoutMs || 5000,
      maxRetries: cfg.maxRetries || 3
    };
  }

  private async fetchWithRetry(url: string, options: RequestInit = {}): Promise<Response> {
    let attempt = 0;
    while (attempt < this.config.maxRetries) {
      attempt++;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), this.config.timeoutMs);

      try {
        const headers = {
          'Accept': 'application/fhir+json, application/json',
          'Authorization': `Bearer ${this.config.authToken}`,
          ...(options.headers || {})
        };

        const res = await fetch(url, { ...options, headers, signal: controller.signal });
        clearTimeout(id);
        if (res.ok || res.status === 404) {
          return res;
        }
        if (attempt >= this.config.maxRetries) {
          return res;
        }
      } catch (err: any) {
        clearTimeout(id);
        if (attempt >= this.config.maxRetries) {
          throw new Error(`FHIR Exchange failed after ${attempt} attempts: ${err.message}`);
        }
      }
      // Exponential backoff
      await new Promise(r => setTimeout(r, attempt * 300));
    }
    throw new Error('FHIR request exceeded retry limit');
  }

  public async getPatient(patientId: string): Promise<FhirPatient | null> {
    const res = await this.fetchWithRetry(`${this.config.baseUrl}/Patient/${patientId}`);
    if (res.status === 404) return null;
    return res.json();
  }

  public async getAppointment(appointmentId: string): Promise<FhirAppointment | null> {
    const res = await this.fetchWithRetry(`${this.config.baseUrl}/Appointment/${appointmentId}`);
    if (res.status === 404) return null;
    return res.json();
  }

  public async getEncounter(encounterId: string): Promise<FhirEncounter | null> {
    const res = await this.fetchWithRetry(`${this.config.baseUrl}/Encounter/${encounterId}`);
    if (res.status === 404) return null;
    return res.json();
  }

  public async getObservation(observationId: string): Promise<FhirObservation | null> {
    const res = await this.fetchWithRetry(`${this.config.baseUrl}/Observation/${observationId}`);
    if (res.status === 404) return null;
    return res.json();
  }
}
