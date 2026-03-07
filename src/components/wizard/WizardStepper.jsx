/**
 * WizardStepper — Dynamic step progress bar.
 * Adapts to the category's step count.
 */
export default function WizardStepper({ totalSteps, currentStep, completedSteps = [], onStepClick }) {
  const dots = [];
  for (let i = 0; i <= totalSteps; i++) {
    const isCompleted = completedSteps.includes(i) || i < currentStep;
    const isActive = i === currentStep;

    if (i > 0) {
      dots.push(
        <div
          key={`line-${i}`}
          className={`wiz-step-line${isCompleted ? ' completed' : ''}`}
        />,
      );
    }
    dots.push(
      <div
        key={`dot-${i}`}
        className={`wiz-step-dot${isActive ? ' active' : ''}${isCompleted && !isActive ? ' completed' : ''}`}
        onClick={() => onStepClick && i <= currentStep && onStepClick(i)}
        title={`Step ${i}`}
      >
        {isCompleted && !isActive ? '' : i}
      </div>,
    );
  }

  return <div className="wiz-stepper">{dots}</div>;
}
