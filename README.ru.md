<h1 align="center">Antigravity Kit</h1>

<table align="center">
<tr>
<td>
<pre><code>
██╗  ██╗██╗████████╗
██║ ██╔╝██║╚══██╔══╝
█████╔╝ ██║   ██║
██╔═██╗ ██║   ██║
██║  ██╗██║   ██║
╚═╝  ╚═╝╚═╝   ╚═╝
</code></pre>
</td>
</tr>
</table>

<p align="center">
  <img alt="Antigravity plugin" src="https://img.shields.io/badge/Antigravity-plugin-5B8DEF?style=for-the-badge&labelColor=111827" />
  <img alt="Kit v0.1.0" src="https://img.shields.io/badge/KIT-v0.1.0-8B5CF6?style=for-the-badge&labelColor=111827" />
  <img alt="skills hooks mcp workflows" src="https://img.shields.io/badge/skills%20%2B%20hooks%20%2B%20MCP-workflows-22C55E?style=for-the-badge&labelColor=111827" />
  <img alt="token optimization" src="https://img.shields.io/badge/tokens-−60–90%25-F59E0B?style=for-the-badge&labelColor=111827" />
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-64748B?style=for-the-badge&labelColor=111827" />
</p>

<p align="center">
  <a href="README.md">English</a> | Русский
</p>

**Antigravity Kit** превращает «сырого» агента Antigravity в дисциплинированный конвейер: план → работа → цикл → ревью, с защитными хуками, структурированным рассуждением и двухслойной токен-оптимизацией, которая бьёт в боль №1 Antigravity — выгорание квот.

```
ваш промпт ──► [wake words / слэш-команды] ──► plan ──► work ──► loop ──► review
                      │                                                     │
                      ▼                                                     ▼
             [хуки: danger guard,                              [обязательный прогон
              rtk-подсказка, продолжение целей]                 тестов до вердикта]

вывод терминала ──► [RTK]      ──► контекст агента   (−60–90% токенов)
большие блобы   ──► [Headroom] ──► LLM API           (−60–95% токенов)
```

## Зачем

| Боль Antigravity | Ответ кита |
| --- | --- |
| Квота сгорает за 10–15 минут работы агента | RTK жмёт вывод терминала; Headroom — блобы; правила токен-гигиены режут расход у источника |
| «Амнезия контекста» — агент забывает файлы трёхпромптовой давности | Планы живут в файлах (`.agents/kit/plans/`) и перечитываются перед каждым шагом; цели переживают обрыв через `.agents/kit-goal.md` |
| Выдуманные импорты и устаревшие знания об API | context7 MCP (свежие доки библиотек) включён по умолчанию |
| `/teamwork-preview` может сжечь недельную квоту на размытом брифе | Предполётный бриф `kit-teamwork` + автонапоминание при упоминании teamwork |
| Разрушительные команды, утечки секретов | Хук `danger-guard`: блок `rm -rf` вне workspace, force-push в main, чтения `.env`/ключей |

Принцип проектирования: ядро (скиллы + MCP) — **переносимый формат Agent Skills**: тот же корпус ставится в Claude Code или Codex одним флагом. Antigravity-специфичен только тонкий адаптер (манифест, хуки, инсталлер).

## Установка

```bash
# глобально — все workspace, все поверхности (IDE, CLI, 2.0)
npx antigravity-kit install

# в проект (коммитится — кит получает вся команда)
npx antigravity-kit install --workspace

# посмотреть план изменений без записи
npx antigravity-kit install --dry-run

# + бинарник rtk и его нативный rewrite-хук для Antigravity
npx antigravity-kit install --with-rtk

# + CLI headroom с включённой MCP-записью
npx antigravity-kit install --with-headroom

# всё сразу (= --with-rtk --with-headroom)
npx antigravity-kit install --full

# добавить слэш-команды /kit-* в текущий проект
npx antigravity-kit workflows

# проверка здоровья / удаление
npx antigravity-kit verify
npx antigravity-kit uninstall
```

Требуется Node 18+. После установки перезапустите Antigravity.

## Цикл кита

Каждый этап доступен двумя способами: **wake word** в промпте (`kit-plan this migration`) или **слэш-команда** (`/kit-plan`) после установки workflows. Слэш-команды — надёжный путь, wake words — ленивый.

| Команда | Роль | Контракт |
| --- | --- | --- |
| `kit-plan` | планировщик | План пишется в `.agents/kit/plans/<slug>.md`: TL;DR, скоуп, шаги-чекбоксы, риски, критерии завершения. **Без кода.** |
| `kit-work` | исполнитель | Перечитывает файл плана перед каждым шагом (переживает обрезание контекста); отмечает шаги только после верификации; отклонения фиксируются явно. |
| `kit` / `kit-loop` | цикл | Test-first циклы: падающий тест → минимальная правка → видимое прохождение. |
| `kit-review` | ревьюер | Дифф по ханкам, затем **обязательный** прогон тестов и линта до вердикта. Формат: Blocking / Recommended / Checks. |
| `kit-clean` | уборщик | Удаляет AI-слоп (мёртвый код, комментарии-пересказы, дубли доков) из диффа. Ноль изменений поведения, доказано тестами. |
| `kit-debug` | отладчик | Воспроизведение → гипотезы через sequential-thinking → доказанная причина → минимальный фикс. |
| `kit-goal` | долгий раннер | Чек-лист в `.agents/kit-goal.md`; Stop-хук продолжает работу, пока не отмечен каждый пункт. |
| `kit-teamwork` | подготовка teamwork | Предполётный бриф для `/teamwork-preview` в `.agents/kit/teamwork-brief.md`: верифицируемые критерии, явные non-goals, непересекающиеся lanes. Сам запуск не делает. |

Два вспомогательных скилла подгружаются по требованию: **kit-seq-thinking** (когда и как включать sequential-thinking, бюджет мыслей 5–9) и **kit-token-hygiene** (rtk-префикс, выборочное чтение, никаких сырых логов).

Текст, похожий на идентификаторы (`kit_helper.mjs`, `src/kit-plan/`), wake words не триггерит; голое `kit` срабатывает только первым словом промпта.

## Токен-оптимизация

Два независимых слоя, экономия которых перемножается — детали в [docs/headroom.md](docs/headroom.md), протокол замера в [docs/token-benchmark.md](docs/token-benchmark.md):

1. **RTK** (терминал): `--with-rtk` ставит бинарник и запускает `rtk init --agent antigravity` — регистрируется нативный rewrite-хук rtk. Собственный `rtk-enforcer` кита — вежливый фолбэк: молчит, когда хук rtk активен, rtk отсутствует или команда составная. Обход: префикс `KIT_RAW=1` или `KIT_RTK_ENFORCE=off`.
2. **Headroom** (всё остальное): зарегистрирован как MCP-сервер (`headroom_compress` / `headroom_retrieve` / `headroom_stats`). Автовключается при установке, если CLI `headroom` найден; `--with-headroom` установит его за вас. `headroom wrap` Antigravity не поддерживает — поддерживаемый путь именно MCP.

Третий, самый дешёвый приём: **tree_sitter MCP** даёт агенту AST-запросы — он забирает символы вместо чтения файлов целиком; мусор, не попавший в контекст, не нужно сжимать.

## Хуки

| Хук | Событие | Поведение |
| --- | --- | --- |
| kit-wake-word | PreInvocation | Инжектит директивы этапов для `kit*`-алиасов через `injectSteps`; читает промпт из `prompt`/`steps[]` с фолбэком на файл транскрипта; напоминает про бриф при упоминании `/teamwork-preview`. Никогда не исполняет shell из промпта. |
| danger-guard | PreToolUse (run_command) | Вето на `rm -rf` вне workspace, force-push в main/master, чтение секретов (`.env*`, ключи, credential-хранилища). |
| rtk-enforcer | PreToolUse (run_command) | Подсказывает `rtk`-префикс для dev-команд; молчит, когда это избыточно или переписывание рискованно. |
| diagnostics-handoff | PostToolUse (правки) | Напоминает прогнать проектные проверки на изменённых файлах. Только guidance — сам ничего не запускает. |
| goal-continuation | Stop | `{"decision": "continue"}`, пока идёт фоновая работа (`fullyIdle: false`) или в `.agents/kit-goal.md` есть неотмеченные пункты. |

Все хуки **fail-open**: любая внутренняя ошибка разрешается в «allow» и не ломает сессию. Wire-форматы — те, что проверены в проде antigravity-swarm (`injectSteps` для инжекта, `decision: "continue" | ""` для Stop).

## MCP-серверы

По умолчанию — только локальные stdio-серверы **без кредов**: поставил и работает. Серверы с ключами идут выключенными с плейсхолдерами; реальные секреты в конфиге не живут никогда.

| Сервер | Назначение | Ключ | По умолчанию |
| --- | --- | --- | --- |
| sequential-thinking | структурированное рассуждение для plan/debug | нет | включён |
| tree_sitter | AST-запросы вместо чтения файлов целиком | нет | включён |
| context7 | свежие доки библиотек (анти-галлюцинации) | опциональный ключ поднимает лимиты | включён |
| headroom | сжатие блобов по запросу | нет (нужен CLI `headroom`) | авто: включается при найденном CLI |

Известные ограничения preview: MCP OAuth не поддержан (для remote-серверов — API-ключи); передача через `env` не работает в части билдов — кладите ключи в `args`, если сервер игнорирует `env`.

## Субагенты

Два TOML-пресета в `agents/` (ставятся вместе с деревом плагина):

| Агент | Роль |
| --- | --- |
| `kit-planner` | Только план: нумерованный план со скоупом, рисками, критериями. Файлы не правит. |
| `kit-reviewer` | Строгий верификатор: требует выполненных тестов/линта, находки по severity, вердикт `KIT APPROVED` / `KIT REJECTED`. Отсутствие доказательств — блокер. |

Поле `model` по умолчанию `gemini-3.5-flash` — меняется в TOML. Кастомные субагенты могут требовать платный план; если ваш билд их не видит, остальной кит не страдает.

## Пути

| Поверхность | Плагины | MCP-конфиг | Хуки |
| --- | --- | --- | --- |
| Общая (IDE + CLI + 2.0) | `~/.gemini/config/plugins/` | `~/.gemini/config/mcp_config.json` | через плагин |
| Только CLI | `~/.gemini/antigravity-cli/plugins/` | — | `~/.gemini/antigravity-cli/hooks.json` |
| Workspace | `.agents/plugins/` | `.agents/mcp_config.json` | `.agents/hooks.json` |

Скиллы, rules, хуки и субагенты живут **внутри директории плагина** и обнаруживаются оттуда — отдельная папка скиллов не нужна. Antigravity 2.0 делит корень `~/.gemini/config/` с IDE и CLI, так что одна глобальная установка покрывает все три поверхности. Плагины обратно совместимы с расширениями Gemini CLI. Инсталлер сам определяет фактический layout и зеркалирует в CLI-путь, если тот существует; merge MCP-конфига неразрушающий (ваши серверы не трогаются), uninstall удаляет только нетронутые вами записи.

## Перенос в другие хосты

Корпус скиллов — чистый формат Agent Skills:

```bash
npx antigravity-kit install --host claude-code   # → ~/.claude/skills/
npx antigravity-kit install --host codex          # → ~/.codex/skills/
```

Что переносится, а что нет: [docs/portability.md](docs/portability.md).

## Безопасность

- `rules/safety.md`: запрещённые команды, политика секретов (не читать `.env*`/ключи, только плейсхолдеры) — подстраховывается хуком `danger-guard`.
- `--permission-profile safe|balanced|full|none` (по умолчанию `safe`): пишется в собственный namespace кита в настройках; enforcement — через rules + хуки, пока схема настроек preview не стабилизируется.

## Разработка

```bash
npm test                        # node --test: 31 тест, ноль зависимостей
node bin/cli.mjs install --dry-run
```

Структура: `plugins/antigravity-kit/` — payload (скиллы, rules, хуки, скрипты, workflows, агенты, mcp_config); `installer/` + `bin/cli.mjs` — npx-инсталлер. Логика хуков — в импортируемых `.mjs`-модулях; `hooks/hooks.json` — тонкий адаптер: при смене формата preview обновляется только он. Референс-дизайн директив для хост-команд: [docs/command-directives.md](docs/command-directives.md).

## Благодарности

- [antigravity-swarm](https://github.com/wjgoarxiv/antigravity-swarm) — паттерн workflow-слоя и проверенные боем wire-форматы хуков.
- [rtk](https://github.com/rtk-ai/rtk) — сжатие вывода терминала.
- [headroom](https://github.com/chopratejas/headroom) — сжатие контекста для всего остального.

## Лицензия

MIT
