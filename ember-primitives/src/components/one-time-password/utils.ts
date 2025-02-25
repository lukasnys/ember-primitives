import { assert } from '@ember/debug';

function getInputs(current: HTMLInputElement) {
  let fieldset = current.closest('fieldset');

  assert('[BUG]: fieldset went missing', fieldset);

  return [...fieldset.querySelectorAll('input')];
}

function nextInput(current: HTMLInputElement) {
  let inputs = getInputs(current);
  let currentIndex = inputs.indexOf(current);

  return inputs[currentIndex + 1];
}

export function handleNavigation(event: KeyboardEvent) {
  switch (event.key) {
    case 'Backspace':
      return handleBackspace(event);
    case 'ArrowLeft':
      return focusLeft(event);
    case 'ArrowRight':
      return focusRight(event);
  }
}

function focusLeft(event: Pick<Event, 'target'>) {
  let target = event.target;

  assert(`only allowed on input elements`, target instanceof HTMLInputElement);

  let input = previousInput(target);

  input?.focus();
  input?.select();
}

function focusRight(event: Pick<Event, 'target'>) {
  let target = event.target;

  assert(`only allowed on input elements`, target instanceof HTMLInputElement);

  let input = nextInput(target);

  input?.focus();
  input?.select();
}

function handleBackspace(event: KeyboardEvent) {
  if (event.key !== 'Backspace') return;

  let target = event.target;

  // We need to requestAnimationFrame here, because
  // we don't want to change focus before the native browser
  // behavior of backspace (deleting a character backwards)
  // has taken affect.
  requestAnimationFrame(() => {
    focusLeft({ target });
  });
}

function previousInput(current: HTMLInputElement) {
  let inputs = getInputs(current);
  let currentIndex = inputs.indexOf(current);

  return inputs[currentIndex - 1];
}

export const autoAdvance = (event: Event) => {
  assert(
    '[BUG]: autoAdvance called on non-input element',
    event.target instanceof HTMLInputElement,
  );

  let value = event.target.value;

  if (value.length === 0) return;
  if (value.length === 1) return focusRight(event);

  const digits = value;
  let i = 0;
  let currElement: HTMLInputElement | null = event.target;

  while (currElement) {
    currElement.value = digits[i++] || '';

    let next = nextInput(currElement);

    if (next instanceof HTMLInputElement) {
      currElement = next;
    } else {
      break;
    }
  }
};

export function getCollectiveValue(elementTarget: EventTarget | null, length: number) {
  if (!elementTarget) return;

  assert(
    `[BUG]: somehow the element target is not HTMLElement`,
    elementTarget instanceof HTMLElement,
  );

  let parent: null | HTMLElement | ShadowRoot;

  // TODO: should this logic be extracted?
  //       why is getting the target element within a shadow root hard?
  if (!(elementTarget instanceof HTMLInputElement)) {
    if (elementTarget.shadowRoot) {
      parent = elementTarget.shadowRoot;
    } else {
      parent = elementTarget.closest('fieldset');
    }
  } else {
    parent = elementTarget.closest('fieldset');
  }

  assert(`[BUG]: somehow the input fields were rendered without a parent element`, parent);

  let elements = parent.querySelectorAll('input');

  let value = '';

  assert(
    `found elements (${elements.length}) do not match length (${length}). Was the same OTP input rendered more than once?`,
    elements.length === length,
  );

  for (let element of elements) {
    assert(
      '[BUG]: how did the queried elements become a non-input element?',
      element instanceof HTMLInputElement,
    );
    value += element.value;
  }

  return value;
}
