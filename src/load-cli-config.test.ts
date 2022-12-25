import { asserts } from './deps.ts';
import { loadCLIConfig } from './load-cli-config.ts';

Deno.test('Load CLI config', async (t) => {
  await t.step('if path was not passed', async (t) => {
    await t.step(
      'should throw Error if unable to resolve HOME path',
      async () => {
        const homeEnvName = Deno.build.os === 'windows'
          ? 'USERPROFILE'
          : 'HOME';
        const homeEnvValue = Deno.env.get(homeEnvName);
        Deno.env.delete(homeEnvName);
        await asserts.assertRejects(
          loadCLIConfig,
          Error,
          '❌ Unable to resolve path to HOME in order to load default CLI config',
        );
        homeEnvValue && Deno.env.set(homeEnvName, homeEnvValue);
      },
    );
  });
});
