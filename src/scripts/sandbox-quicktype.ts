import 'dotenv/config';
import figlet from 'figlet';

import {
  quicktype,
  InputData,
  jsonInputForTargetLanguage,
  type LanguageName,
} from 'quicktype-core';

async function quickTypeJSON(targetLanguage: LanguageName, typeName: string, jsonString: string) {
  const jsonInput = jsonInputForTargetLanguage(targetLanguage);

  // We could add multiple samples for the same desired
  // type, or many sources for other types. Here we're
  // just making one type from one piece of sample JSON.
  await jsonInput.addSource({
    name: typeName,
    samples: [jsonString],
  });

  const inputData = new InputData();
  inputData.addInput(jsonInput);

  return await quicktype({
    inputData,
    lang: targetLanguage,
  });
}

async function run() {
  console.log(await figlet.text('Sandbox', {font: 'Slant'}));
  console.log(`--------------- START OF SCRIPT --------------\n\n`);

  const str = await quickTypeJSON('typescript', 'Ttl', '{"foo": "bar"}');
  console.log(str.lines.join('\n'));

  console.log(`\n\n--------------- END OF SCRIPT ----------------`);
  process.exit();
}

run();
