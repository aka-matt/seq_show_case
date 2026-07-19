import { SequenceDiagramElement } from './web-component/SequenceDiagramElement';

// Register the custom element
if (!customElements.get('sequence-diagram')) {
  customElements.define('sequence-diagram', SequenceDiagramElement);
}

export { SequenceDiagramElement };
