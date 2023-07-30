import { COMMANDS } from './const.ts';
import { asserts } from './deps.ts';
import { ValidationError } from './errors.ts';
import { parseFlags } from './parse-flags.ts';

const randomUUID = globalThis.crypto.randomUUID();

Deno.test('parseFlags()', async (t) => {
  await t.step(
    'should throw an Error if unknown command has passed',
    async () => {
      await asserts.assertRejects(
        async () => {
          await parseFlags([randomUUID]);
        },
        ValidationError,
        `Unknown command: "${randomUUID}". Please use one of these: ${
          COMMANDS.join(', ')
        }.`,
      );
    },
  );

  await t.step(
    'should throw an Error if neither --pipeline-id nor --project-id has defined',
    async () => {
      await asserts.assertRejects(
        async () => {
          await parseFlags([
            COMMANDS[0],
            '--token',
            randomUUID,
          ]);
        },
        ValidationError,
        'Neither Pipeline ID nor Project ID has been defined. Please use "--pipeline-id" or "--project-id" flag',
      );
    },
  );

  await t.step(
    'should throw an Error if both --pipeline-id and --project-id has defined',
    async () => {
      await asserts.assertRejects(
        async () => {
          await parseFlags([
            COMMANDS[0],
            '--token',
            randomUUID,
            '--pipeline-id',
            randomUUID,
            '--project-id',
            randomUUID,
          ]);
        },
        ValidationError,
        'Both Pipeline ID and Project ID have been defined. Please choose "--pipeline-id" or "--project-id" flag',
      );
    },
  );

  await t.step(
    'should parse pipelineId if --pipeline-id has been defined',
    async () => {
      const passedPipelineId = globalThis.crypto.randomUUID();
      const { flags: { pipelineId } } = await parseFlags([
        COMMANDS[0],
        '--token',
        randomUUID,
        '--pipeline-id',
        passedPipelineId,
      ]);
      asserts.assertEquals(
        pipelineId,
        passedPipelineId,
      );
    },
  );

  await t.step(
    'should parse projectId if --project-id has been defined',
    async () => {
      const passedProjectId = globalThis.crypto.randomUUID();
      const { flags: { projectId } } = await parseFlags([
        COMMANDS[0],
        '--token',
        randomUUID,
        '--project-id',
        passedProjectId,
      ]);
      asserts.assertEquals(
        projectId,
        passedProjectId,
      );
    },
  );
});
