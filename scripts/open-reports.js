#!/usr/bin/env node

import fs from 'fs';

/**
 * Script to view JSON test reports and optionally open related files
 */

const jsonReports = [
	{
		name: 'Combined Test Report',
		path: './test-results/test-report.json',
		description: 'Aggregated results from all test workspaces'
	},
	{
		name: 'Client Tests (Components)',
		path: './test-results/client-results.json',
		description: 'Component and UI tests results'
	},
	{
		name: 'Server Tests (Utils/Services)',
		path: './test-results/server-results.json',
		description: 'Server-side and utility tests results'
	},
	{
		name: 'Integration Tests',
		path: './test-results/integration-results.json',
		description: 'Integration test results'
	},
	{
		name: 'Storybook Tests',
		path: './test-results/storybook-results.json',
		description: 'Storybook component tests results'
	},
	{
		name: 'Coverage Summary',
		path: './coverage/coverage-summary.json',
		description: 'Code coverage metrics'
	},
	{
		name: 'Playwright Results',
		path: './test-results/playwright-results.json',
		description: 'E2E test results'
	}
];

const textReports = [
	{
		name: 'Summary Report',
		path: './test-results/summary.md',
		description: 'Human-readable test summary'
	}
];

function displayJsonReport(reportPath, reportName) {
	try {
		if (!fs.existsSync(reportPath)) {
			console.log(`❌ ${reportName}: Not found`);
			return false;
		}

		const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
		console.log(`\n📊 ${reportName}`);
		console.log('─'.repeat(50));

		// Display based on report type
		if (reportPath.includes('test-report.json')) {
			// Combined report
			displayCombinedReport(data);
		} else if (reportPath.includes('coverage-summary.json')) {
			// Coverage report
			displayCoverageReport(data);
		} else if (reportPath.includes('playwright-results.json')) {
			// Playwright report
			displayPlaywrightReport(data);
		} else {
			// Individual workspace report
			displayWorkspaceReport(data, reportName);
		}

		return true;
	} catch (error) {
		console.log(`❌ ${reportName}: Error reading file - ${error.message}`);
		return false;
	}
}

function displayCombinedReport(data) {
	console.log(`📅 Generated: ${new Date(data.generated).toLocaleString()}`);
	console.log(`📊 Total Tests: ${data.summary.total}`);
	console.log(`✅ Passed: ${data.summary.passed}`);
	console.log(`❌ Failed: ${data.summary.failed}`);
	console.log(`⏸️  Skipped: ${data.summary.skipped}`);
	console.log(`⏱️  Duration: ${formatDuration(data.summary.duration)}`);
	console.log(`🎯 Success: ${data.summary.success ? 'YES' : 'NO'}`);

	if (data.coverage) {
		console.log(
			`📈 Coverage: ${data.coverage.statements}% statements, ${data.coverage.lines}% lines`
		);
	}

	if (data.errors && data.errors.length > 0) {
		console.log(`\n🚨 Failed Tests (${data.errors.length}):`);
		data.errors.slice(0, 5).forEach((error, index) => {
			console.log(`   ${index + 1}. ${error.test} (${error.file})`);
		});
		if (data.errors.length > 5) {
			console.log(`   ... and ${data.errors.length - 5} more`);
		}
	}

	console.log('\n📁 Workspaces:');
	Object.values(data.workspaces).forEach((workspace) => {
		console.log(`   • ${workspace.name}: ${workspace.passed}/${workspace.total} passed`);
	});
}

function displayWorkspaceReport(data) {
	// Try to extract stats from different Vitest formats
	let stats = extractStatsFromVitest(data);

	if (stats) {
		console.log(`📊 Tests: ${stats.total}`);
		console.log(`✅ Passed: ${stats.passed}`);
		console.log(`❌ Failed: ${stats.failed}`);
		console.log(`⏸️  Skipped: ${stats.skipped}`);
		console.log(`⏱️  Duration: ${formatDuration(stats.duration)}`);
	} else {
		console.log('📄 Raw data available (use --raw flag to view)');
	}
}

function displayCoverageReport(data) {
	if (data.total) {
		console.log(
			`📊 Statements: ${data.total.statements.pct}% (${data.total.statements.covered}/${data.total.statements.total})`
		);
		console.log(
			`🌿 Branches: ${data.total.branches.pct}% (${data.total.branches.covered}/${data.total.branches.total})`
		);
		console.log(
			`🔧 Functions: ${data.total.functions.pct}% (${data.total.functions.covered}/${data.total.functions.total})`
		);
		console.log(
			`📝 Lines: ${data.total.lines.pct}% (${data.total.lines.covered}/${data.total.lines.total})`
		);
	}
}

function displayPlaywrightReport(data) {
	// Playwright JSON structure varies, display what we can
	if (data.stats) {
		console.log(`📊 Tests: ${data.stats.total || 'N/A'}`);
		console.log(`✅ Passed: ${data.stats.passed || 'N/A'}`);
		console.log(`❌ Failed: ${data.stats.failed || 'N/A'}`);
		console.log(`⏸️  Skipped: ${data.stats.skipped || 'N/A'}`);
	} else {
		console.log('📄 Playwright data available (use --raw flag to view)');
	}
}

function extractStatsFromVitest(data) {
	// Handle different Vitest JSON formats
	if (data.testResults) {
		let total = 0,
			passed = 0,
			failed = 0,
			skipped = 0,
			duration = 0;

		data.testResults.forEach((testFile) => {
			if (testFile.assertionResults) {
				testFile.assertionResults.forEach((test) => {
					total++;
					if (test.status === 'passed') passed++;
					else if (test.status === 'failed') failed++;
					else if (test.status === 'skipped') skipped++;
				});
			}
			duration += testFile.endTime - testFile.startTime || 0;
		});

		return { total, passed, failed, skipped, duration };
	}

	if (data.numTotalTests !== undefined) {
		return {
			total: data.numTotalTests || 0,
			passed: data.numPassedTests || 0,
			failed: data.numFailedTests || 0,
			skipped: data.numPendingTests || 0,
			duration: data.perfStats?.runtime || 0
		};
	}

	return null;
}

function formatDuration(ms) {
	if (!ms || ms < 1000) return `${ms || 0}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
	return `${(ms / 60000).toFixed(2)}m`;
}

function viewTextReports() {
	console.log('\n📄 Text Reports:');
	textReports.forEach((report) => {
		if (fs.existsSync(report.path)) {
			console.log(`✅ ${report.name}: ${report.path}`);

			// Show first few lines of markdown summary
			if (report.path.includes('.md')) {
				try {
					const content = fs.readFileSync(report.path, 'utf8');
					const lines = content.split('\n').slice(0, 10);
					console.log('   Preview:');
					lines.forEach((line) => console.log(`   ${line}`));
					if (content.split('\n').length > 10) {
						console.log('   ...');
					}
				} catch {
					console.log('   (Preview not available)');
				}
			}
		} else {
			console.log(`❌ ${report.name}: Not found`);
		}
	});
}

function showCommands() {
	console.log('\n💡 Useful Commands:');
	console.log('   # View specific JSON report with jq (if installed)');
	console.log('   cat ./test-results/test-report.json | jq .');
	console.log('');
	console.log('   # View coverage report');
	console.log('   cat ./coverage/coverage-summary.json | jq .total');
	console.log('');
	console.log('   # View failed tests only');
	console.log('   cat ./test-results/test-report.json | jq .errors');
	console.log('');
	console.log('   # View workspace results');
	console.log('   cat ./test-results/test-report.json | jq .workspaces');
}

function main() {
	const args = process.argv.slice(2);
	const showRaw = args.includes('--raw');

	console.log('\n📊 Test Results Report\n' + '='.repeat(50));

	let foundReports = false;

	// Display JSON reports
	console.log('\n📋 JSON Reports:');
	jsonReports.forEach((report) => {
		if (displayJsonReport(report.path, report.name)) {
			foundReports = true;
		}
	});

	// Display text reports
	viewTextReports();

	if (!foundReports) {
		console.log('\n⚠️  No reports found. Run tests first:');
		console.log('   npm run test:all        # Run all tests');
		console.log('   npm run test:client     # Run component tests');
		console.log('   npm run test:server     # Run utility tests');
		console.log('   npm run test:integration # Run integration tests');
		console.log('   npx playwright test     # Run E2E tests');
	} else {
		showCommands();
	}

	console.log('\n📁 Report directories:');
	console.log('   ./test-results/   # JSON reports and summaries');
	console.log('   ./coverage/       # Coverage reports');
	console.log('   ./playwright-report/ # E2E reports');

	if (showRaw) {
		console.log('\n🔍 Raw Data (--raw flag detected):');
		jsonReports.forEach((report) => {
			if (fs.existsSync(report.path)) {
				console.log(`\n--- ${report.name} ---`);
				console.log(fs.readFileSync(report.path, 'utf8'));
			}
		});
	}
}

// Main execution
if (require.main === module) {
	main();
}

module.exports = { displayJsonReport, extractStatsFromVitest, formatDuration };
