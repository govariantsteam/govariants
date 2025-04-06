// based on https://github.com/mdn/dom-examples/blob/main/web-speech-api/speak-easy-synthesis/script.js

export function speak(text: string): void {
  window.speechSynthesis.cancel();
  // const voice = window.speechSynthesis.getVoices().at(0);
  // if (!voice) return;

  const utter = new SpeechSynthesisUtterance(text);
  // utter.voice = voice;
  // utter.rate = 1.8;
  window.speechSynthesis.speak(utter);
}
