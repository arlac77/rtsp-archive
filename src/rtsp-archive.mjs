import { ServiceRecorder } from "./service-recorder.mjs";


export async function setup(sp) {

  await sp.declareServices({
    recorder: {
      type: ServiceRecorder
    }
  });

  sp.start();
}

