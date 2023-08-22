# Disable triggers

Small CLI which allows you to disable all pipeline triggers at once — with the
ability to reenable it back!

## Installation

Please dowload latest binary from
[Releases section](https://github.com/codefresh-support/disable-triggers/releases).

## Usage

### `cf-triggers disable`

It disables in-spec triggers (with optional removal of other ones) and stores
all disabled/removed triggers in pipeline annotations `disabled_git_triggers`,
`disabled_cron_triggers` and `deleted_triggers`.

#### Flags

- `--token` [ required ] — your codefresh token. Will be ignored if
  `--use-cfconfig` was set.
- `--pipeline-id` [ required unless `--project-id` is set ] — ID of target
  pipeline.
- `--project-id` [ required unless `--pipeline-id` is set ] — ID of target
  project.
- `--delete-triggers` [ optional, defaults to `false` ] — if set, triggers that
  non in a pipeline spec will be removed (old cron triggers, registry, helm).
- `--host` [ optional, defaults to `https://g.codefresh.io` ] — if set, will be
  used for API calls. Will be ignored if `--use-cfconfig` was set.
- `--use-cfconfig` [ optional, defaults to `false` ] — if `true`, uses token and
  API host from [Codefresh CLI](https://codefresh-io.github.io/cli/) config. If
  set, `--token` and `--host` flags are ignored.
- `--cfconfig` [ optional ] — path to the Codefresh CLI config. Makes sense only
  together with `--use-cfconfig`. If not set, default path will be used
  (Windows: `%USERPROFILE%\.cfconfig`, Linux/Apple: `$HOME/.cfconfig`).
- `--cfconfig-context` [ optional ] — Codefresh CLI context to use. Makes sense
  only together with `--use-cfconfig`. If not set, `current-context` will be
  used.

#### Examples

```Shell
$ cf-triggers disable --token=<your-codefresh-token> --pipeline-id=<target-pipeline-id> --delete-triggers
```

```Shell
$ cf-triggers disable --use-cfconfig --cfconfig=<path-to-config> --cfconfig-context=<desired-context> --pipeline-id=<target-pipeline-id> --delete-triggers
```

```Shell
$ cf-triggers disable --use-cfconfig --pipeline-id=<target-pipeline-id>
```

![Disable triggers example](./assets/disable-example.png)
![Annotations example](./assets/annotations-example.png)

### `cf-triggers enable`

It enables git triggers and recreates non-git triggers in accordance with
`disabled_git_triggers`, `disabled_cron_triggers` and `deleted_triggers`
annotations of target pipeline.

Once it's done, it removes the above annotations.

#### Flags

- `--token` [ required ] — your codefresh token. Will be ignored if
  `--use-cfconfig` was set.
- `--pipeline-id` [ required ] — ID of target pipeline.
- `--host` [ optional, defaults to `https://g.codefresh.io` ] — if set, will be
  used for API calls. Will be ignored if `--use-cfconfig` was set.
- `--use-cfconfig` [ optional, defaults to `false` ] — if `true`, uses token and
  API host from [Codefresh CLI](https://codefresh-io.github.io/cli/) config. If
  set, `--token` and `--host` flags are ignored.
- `--cfconfig` [ optional ] — path to the Codefresh CLI config. Makes sense only
  together with `--use-cfconfig`. If not set, default path will be used
  (Windows: `%USERPROFILE%\.cfconfig`, Linux/Apple: `$HOME/.cfconfig`).
- `--cfconfig-context` [ optional ] — Codefresh CLI context to use. Makes sense
  only together with `--use-cfconfig`. If not set, `current-context` will be
  used.

#### Examples

```Shell
$ cf-triggers enable --token=<your-codefresh-token> --pipeline-id=<target-pipeline-id>
```

```Shell
$ cf-triggers enable --use-cfconfig --pipeline-id=<target-pipeline-id>
```

![Enable triggers example](./assets/enable-example.png)
