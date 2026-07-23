# Skill: Rocketseat Quiz Automation

## Overview
This skill defines the process for answering quizzes on the Rocketseat platform.

## Workflow
1. **Detection**: Navigate to the Quiz URL.
2. **Start**: Click the "Começar" button or press "Enter".
3. **Answering**:
   - Capture the question and options from the DOM.
   - Use LLM to identify the correct answer index (1-based).
   - Press the corresponding number key (1, 2, 3, 4).
   - Press "Enter" to confirm the selection.
4. **Feedback**:
   - After confirmation, press "Enter" again to proceed to the next question (or click "Próximo").
5. **Finalization**:
   - At the last question, click "Finalizar" or press "Enter".
   - View results and click "Continuar" to return to the course contents.

## Selectors
- **Start Button**: `button:has-text("Começar")`
- **Question Text**: `main paragraph` (usually first paragraph in main)
- **Options**: `radiogroup div` or buttons with numbers.
- **Confirm Button**: `button:has-text("Confirmar")`
- **Next Button**: `button:has-text("Próximo")`
- **Finalize Button**: `button:has-text("Finalizar")`
- **Continue Button**: `button:has-text("Continuar")`

## Keyboard Shortcuts
- Numbers `1-9`: Select option.
- `Enter`: Confirm / Next / Finish.
