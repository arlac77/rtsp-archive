import { RecorderService } from "./recorder-service.mjs";


export async function setup(sp) {

  await sp.configureServices({
    recorder: {
      type: RecorderService
    }
  });

  sp.start();
}

