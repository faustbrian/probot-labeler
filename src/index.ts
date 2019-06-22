import { Application, Context } from "probot";

interface ILabel {
	pattern: string;
	label: string;
}

const assignLabel = async (context: Context, levels: ILabel[], name: string): Promise<void> => {
	const { owner, repo } = context.repo();

	let issueNumber: number;

	if (context.payload.pull_request) {
		issueNumber = context.payload.pull_request.number;
	} else if (context.payload.issue) {
		issueNumber = context.payload.issue.number;
	}

	try {
		await context.github.issues.addLabels({
			owner,
			repo,
			issue_number: issueNumber,
			labels: [name],
		});
	} catch {
		// do nothing...
	}

	for (const level of levels) {
		try {
			if (level.label === name) {
				continue;
			}

			await context.github.issues.removeLabel({
				owner,
				repo,
				issue_number: issueNumber,
				name: level.label,
			});
		} catch {
			// do nothing...
		}
	}
};

const assignTopic = async (context: Context) => {
	const { labeler } = await context.config("botamic.yml", {
		labeler: {
			feat: {
				pattern: "feat:|feat(.*):",
				label: "Type: Feature",
			},
			fix: {
				pattern: "fix:|fix(.*):",
				label: "Type: Bugfix",
			},
			polish: {
				pattern: "polish:|polish(.*):",
				label: "Type: Polish",
			},
			docs: {
				pattern: "docs:|docs(.*):",
				label: "Type: Documentation",
			},
			style: {
				pattern: "style:|style(.*):",
				label: "Type: Style",
			},
			refactor: {
				pattern: "refactor:|refactor(.*):",
				label: "Type: Refactor",
			},
			perf: {
				pattern: "perf:|perf(.*):",
				label: "Type: Performance",
			},
			test: {
				pattern: "test:|test(.*):",
				label: "Type: Test",
			},
			workflow: {
				pattern: "workflow:|workflow(.*):",
				label: "Type: Workflow",
			},
			ci: {
				pattern: "ci:|ci(.*):",
				label: "Type: Continuous Integration",
			},
			chore: {
				pattern: "chore:|chore(.*):",
				label: "Type: Chore",
			},
			types: {
				pattern: "types:|types(.*):",
				label: "Type: Types",
			},
			release: {
				pattern: "release:|release(.*):",
				label: "Type: Release",
			},
		},
	});

	let title: string;

	if (context.payload.pull_request) {
		title = context.payload.pull_request.title;
	} else if (context.payload.issue) {
		title = context.payload.issue.title;
	}

	for (const label of Object.values(labeler) as ILabel[]) {
		if (new RegExp(label.pattern).test(title)) {
			assignLabel(context, Object.values(labeler), label.label);
		}
	}
};

export = (robot: Application) => {
	robot.on("issues.edited", assignTopic);
	robot.on("issues.opened", assignTopic);
	robot.on("issues.reopened", assignTopic);

	robot.on("pull_request.edited", assignTopic);
	robot.on("pull_request.opened", assignTopic);
	robot.on("pull_request.reopened", assignTopic);
};
