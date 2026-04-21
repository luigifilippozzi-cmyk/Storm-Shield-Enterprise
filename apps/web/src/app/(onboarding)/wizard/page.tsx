'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWizardActions } from '@/hooks/use-wizard';
import { Step1ShopInfo } from '@/components/onboarding/step-1-shop-info';
import { Step2InviteTeam } from '@/components/onboarding/step-2-invite-team';
import { Step3Insurance } from '@/components/onboarding/step-3-insurance';
import { Step4SampleData } from '@/components/onboarding/step-4-sample-data';
import { Step5ServiceOrder } from '@/components/onboarding/step-5-service-order';

const TOTAL_STEPS = 5;

function WizardProgress({ step }: { step: number }) {
  return (
    <div className="mb-8">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">Step {step} of {TOTAL_STEPS}</span>
        <span className="text-muted-foreground">{Math.round((step / TOTAL_STEPS) * 100)}% complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function WizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [estimateId, setEstimateId] = useState('');

  const { startWizard, recordStep, completeWizard, skipWizard } = useWizardActions();

  useEffect(() => {
    startWizard.mutate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = async (nextStep: number) => {
    await recordStep.mutateAsync(step);
    setStep(nextStep);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSkip = async () => {
    await skipWizard.mutateAsync();
    router.replace('/app');
  };

  const handleComplete = async () => {
    await completeWizard.mutateAsync();
    router.replace('/app/cockpit');
  };

  const isMutating =
    startWizard.isPending ||
    recordStep.isPending ||
    completeWizard.isPending ||
    skipWizard.isPending;

  return (
    <div className="rounded-xl border bg-card p-8 shadow-sm">
      <WizardProgress step={step} />

      {step === 1 && (
        <Step1ShopInfo
          onNext={() => goNext(2)}
          onSkip={handleSkip}
          isLoading={isMutating}
        />
      )}

      {step === 2 && (
        <Step2InviteTeam
          onNext={() => goNext(3)}
          onBack={goBack}
          onSkip={handleSkip}
          isLoading={isMutating}
        />
      )}

      {step === 3 && (
        <Step3Insurance
          onNext={() => goNext(4)}
          onBack={goBack}
          onSkip={handleSkip}
          isLoading={isMutating}
        />
      )}

      {step === 4 && (
        <Step4SampleData
          onNext={(id) => {
            setEstimateId(id);
            goNext(5);
          }}
          onBack={goBack}
          onSkip={handleSkip}
          isLoading={isMutating}
        />
      )}

      {step === 5 && (
        <Step5ServiceOrder
          estimateId={estimateId}
          onComplete={handleComplete}
          onBack={goBack}
          onSkip={handleSkip}
          isLoading={isMutating}
        />
      )}
    </div>
  );
}
