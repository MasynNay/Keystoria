.PHONY: run test check

run:
	python -m server.app

check:
	python -m compileall -q server
	node --check web/app.js
	node --check web/sound.js
	node --check web/ui/views.js
	node --check web/ui/progression.js
	node --check web/ui/preferences.js
	node --check web/ui/lessons.js
	node --check web/ui/training-view.js
	node --check web/ui/lesson-output.js
	node --check web/ui/typing-feedback.js
	node --check web/ui/speed-engine.js
	node --check web/ui/speed-controller.js
	node --check web/ui/speed-view.js
	node --check web/ui/speed-flow.js
	node --check web/ui/scene-action-stage.js
	node --check web/ui/scene-legends.js
	node --check web/ui/mission-scenes.js
	node --check web/ui/scene-narratives.js
	node --check web/ui/scene-illustrations.js
	node --check web/ui/field-controls.js
	node --check web/ui/scene-effects.js
	node --check web/ui/command-guides.js
	node --check web/ui/mission-colors.js
	node --check web/ui/lyric-lab-core.js
	node --check web/ui/lyric-lab-controller.js

test: check
	python -m unittest discover -s tests -v
	node --test --test-concurrency=1 tests/test_*.mjs
