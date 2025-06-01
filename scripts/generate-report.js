#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to aggregate and format JSON test results from different workspaces
 */

const reportFiles = [
	{
		name: 'Client Tests (Components/UI)',
		file: './test-results/client-results.json',
		workspace: 'client'
	},
	{
		name: 'Server Tests (Utils/Services)',
		file: './test-results/server-results.json',
		workspace: 'server'
	},
	{
		name: 'Integration Tests',
		file: './test-results/integration-results.json',
		workspace: 'integration'
	},
	{
		name: 'Storybook Tests',
		file: './test-results/storybook-results.json',
		workspace: 'storybook'
	},
	{
		name: 'All Tests Combined',
		file: './test-results/vitest-results.json',
		workspace: 'all'
	}
];

function readJsonFile(filePath) {
	try {
		if (fs.existsSync(filePath)) {
			return JSON.parse(fs.readFileSync(filePath, 'utf8'));
		}
		return null;
	} catch (error) {
		console.error(`Error reading ${filePath}:`, error.message);
		return null;
	}
}

function formatDuration(ms) {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
	return `${(ms / 60000).toFixed(2)}m`;
}

function extractTestStats(results) {
	if (!results) return null;

	const stats = {
		total: 0,
		passed: 0,
		failed: 0,
		skipped: 0,
		duration: 0,
		errors: [],
		coverage: null
	};

	// Handle different Vitest result formats
	if (results.testResults) {
		// Standard Vitest format
		results.testResults.forEach((testFile) => {
			if (testFile.assertionResults) {
				testFile.assertionResults.forEach((test) => {
					stats.total++;
					if (test.status === 'passed') stats.passed++;
					else if (test.status === 'failed') {
						stats.failed++;
						stats.errors.push({
							test: test.title,
							file: testFile.name,
							error: test.failureMessages?.[0] || 'Unknown error'
						});
					} else if (test.status === 'skipped') stats.skipped++;
				});
			}
			stats.duration += testFile.endTime - testFile.startTime || 0;
		});
	} else if (results.numTotalTests !== undefined) {
		// Alternative format
		stats.total = results.numTotalTests || 0;
		stats.passed = results.numPassedTests || 0;
		stats.failed = results.numFailedTests || 0;
		stats.skipped = results.numPendingTests || 0;
		stats.duration = results.perfStats?.runtime || 0;
	} else if (Array.isArray(results)) {
		// Array of test results
		results.forEach((result) => {
			const subStats = extractTestStats(result);
			if (subStats) {
				stats.total += subStats.total;
				stats.passed += subStats.passed;
				stats.failed += subStats.failed;
				stats.skipped += subStats.skipped;
				stats.duration += subStats.duration;
				stats.errors.push(...subStats.errors);
			}
		});
	}

	return stats;
}

function generateJsonReport() {
	const reportData = {
		generated: new Date().toISOString(),
		summary: {
			total: 0,
			passed: 0,
			failed: 0,
			skipped: 0,
			duration: 0,
			success: true
		},
		workspaces: {},
		coverage: null,
		errors: []
	};

	console.log('\n📊 Generating Test Report\n' + '='.repeat(50));

	// Process each workspace report
	reportFiles.forEach((report) => {
		console.log(`\n🔍 Processing: ${report.name}`);

		const results = readJsonFile(report.file);
		if (!results) {
			console.log(`   ❌ No results found: ${report.file}`);
			return;
		}

		const stats = extractTestStats(results);
		if (!stats) {
			console.log(`   ❌ Could not parse results from: ${report.file}`);
			return;
		}

		console.log(
			`   ✅ Found ${stats.total} tests (${stats.passed} passed, ${stats.failed} failed)`
		);

		reportData.workspaces[report.workspace] = {
			name: report.name,
			...stats,
			file: report.file
		};

		// Add to summary
		reportData.summary.total += stats.total;
		reportData.summary.passed += stats.passed;
		reportData.summary.failed += stats.failed;
		reportData.summary.skipped += stats.skipped;
		reportData.summary.duration += stats.duration;
		reportData.errors.push(...stats.errors);
	});

	// Check overall success
	reportData.summary.success = reportData.summary.failed === 0;

	// Add coverage data if available
	const coverageSummary = readJsonFile('./coverage/coverage-summary.json');
	if (coverageSummary && coverageSummary.total) {
		reportData.coverage = {
			statements: coverageSummary.total.statements.pct,
			branches: coverageSummary.total.branches.pct,
			functions: coverageSummary.total.functions.pct,
			lines: coverageSummary.total.lines.pct
		};
		console.log(
			`\n📈 Coverage: ${reportData.coverage.statements}% statements, ${reportData.coverage.lines}% lines`
		);
	}

	// Write comprehensive JSON report
	const outputPath = './test-results/test-report.json';
	fs.mkdirSync('./test-results', { recursive: true });
	fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));

	console.log(`\n✅ JSON report generated: ${outputPath}`);

	// Generate summary text report
	generateTextSummary(reportData);

	return reportData;
}

function generateTextSummary(reportData) {
	const summaryLines = [
		'# Test Results Summary',
		'',
		`Generated: ${new Date().toLocaleString()}`,
		'',
		'## Overall Results',
		`- **Total Tests**: ${reportData.summary.total}`,
		`- **Passed**: ${reportData.summary.passed} ✅`,
		`- **Failed**: ${reportData.summary.failed} ${reportData.summary.failed > 0 ? '❌' : '✅'}`,
		`- **Skipped**: ${reportData.summary.skipped}`,
		`- **Duration**: ${formatDuration(reportData.summary.duration)}`,
		`- **Success**: ${reportData.summary.success ? 'YES ✅' : 'NO ❌'}`,
		'',
		'## Workspace Results',
		''
	];

	// Add workspace details
	Object.entries(reportData.workspaces).forEach(([key, workspace]) => {
		summaryLines.push(`### ${workspace.name}`);
		summaryLines.push(
			`- Tests: ${workspace.total} (${workspace.passed} passed, ${workspace.failed} failed)`
		);
		summaryLines.push(`- Duration: ${formatDuration(workspace.duration)}`);
		summaryLines.push(`- File: \`${workspace.file}\``);
		summaryLines.push('');
	});

	// Add coverage if available
	if (reportData.coverage) {
		summaryLines.push('## Coverage Report');
		summaryLines.push(`- **Statements**: ${reportData.coverage.statements}%`);
		summaryLines.push(`- **Branches**: ${reportData.coverage.branches}%`);
		summaryLines.push(`- **Functions**: ${reportData.coverage.functions}%`);
		summaryLines.push(`- **Lines**: ${reportData.coverage.lines}%`);
		summaryLines.push('');
	}

	// Add errors if any
	if (reportData.errors.length > 0) {
		summaryLines.push('## Failed Tests');
		summaryLines.push('');
		reportData.errors.slice(0, 10).forEach((error, index) => {
			summaryLines.push(`### ${index + 1}. ${error.test}`);
			summaryLines.push(`**File**: \`${error.file}\``);
			summaryLines.push(`**Error**: \`${error.error.split('\n')[0]}\``);
			summaryLines.push('');
		});

		if (reportData.errors.length > 10) {
			summaryLines.push(`... and ${reportData.errors.length - 10} more errors`);
			summaryLines.push('');
		}
	}

	// Add file links
	summaryLines.push('## Report Files');
	summaryLines.push('- [JSON Report](./test-report.json)');
	summaryLines.push('- [Coverage Report](../coverage/index.html)');
	summaryLines.push('- [Playwright Report](../playwright-report/index.html)');

	const summaryPath = './test-results/summary.md';
	fs.writeFileSync(summaryPath, summaryLines.join('\n'));
	console.log(`📋 Text summary generated: ${summaryPath}`);

	// Output to console
	console.log('\n' + '='.repeat(50));
	console.log('📊 TEST RESULTS SUMMARY');
	console.log('='.repeat(50));
	console.log(
		`Total: ${reportData.summary.total} | Passed: ${reportData.summary.passed} | Failed: ${reportData.summary.failed}`
	);
	console.log(
		`Duration: ${formatDuration(reportData.summary.duration)} | Success: ${reportData.summary.success ? 'YES' : 'NO'}`
	);

	if (reportData.coverage) {
		console.log(
			`Coverage: ${reportData.coverage.statements}% statements | ${reportData.coverage.lines}% lines`
		);
	}

	console.log('='.repeat(50));
}

// Main execution
if (require.main === module) {
	generateJsonReport();
}

module.exports = { generateJsonReport, extractTestStats };
