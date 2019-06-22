import { Application, Context } from "probot";

interface ILabel {
	pattern: string;
	label: string;
}

const assignLabel = async (context: Context, levels: ILabel[], name: string): Promise<void> => {
	const { owner, repo } = context.repo();

	for (const level of levels) {
		try {
			if (level.label === name) {
				continue;
			}

			await context.github.issues.removeLabel({
				owner,
				repo,
				issue_number: context.payload.pull_request.number,
				name: level.label,
			});
		} catch {
			// do nothing...
		}
	}

	try {
		await context.github.issues.addLabels({
			owner,
			repo,
			issue_number: context.payload.pull_request.number,
			labels: [name],
		});
	} catch {
		// do nothing...
	}
};

const assignTopic = async (context: Context) => {
	const { labeler } = await context.config("botamic.yml", {
		labeler: {
			feat: {
				pattern: "feat",
				label: "Type: Feature",
			},
			fix: {
				pattern: "fix",
				label: "Type: Bugfix",
			},
			polish: {
				pattern: "polish",
				label: "Type: Polish",
			},
			docs: {
				pattern: "docs",
				label: "Type: Documentation",
			},
			style: {
				pattern: "style",
				label: "Type: Style",
			},
			refactor: {
				pattern: "refactor",
				label: "Type: Refactor",
			},
			perf: {
				pattern: "perf",
				label: "Type: Performance",
			},
			test: {
				pattern: "test",
				label: "Type: Test",
			},
			workflow: {
				pattern: "workflow",
				label: "Type: Workflow",
			},
			ci: {
				pattern: "ci",
				label: "Type: Continuous Integration",
			},
			chore: {
				pattern: "chore",
				label: "Type: Chore",
			},
			types: {
				pattern: "types",
				label: "Type: Types",
			},
			release: {
				pattern: "release",
				label: "Type: Release",
			},
		},
	});

	const title: string = context.payload.pull_request.title;

	for (const label of Object.values(labeler) as ILabel[]) {
		if (new RegExp(label.pattern).test(title)) {
			assignLabel(context, Object.values(labeler), label.label);
		}
	}
};

export = (robot: Application) => {
	robot.on("pull_request.edited", assignTopic);
	robot.on("pull_request.opened", assignTopic);
	robot.on("pull_request.reopened", assignTopic);
};