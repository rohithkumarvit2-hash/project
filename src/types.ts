export type PasswordStrength = 'Weak' | 'Medium' | 'Strong' | 'Very Strong';

export interface PasswordAnalysis {
  score: PasswordStrength;
  explanations: string[];
  strongAlternative: string;
  passphraseAlternative: string;
}

export interface LocalMetrics {
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  entropy: number;
}
