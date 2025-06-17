import { spawnSync } from "bun";
import fs from "node:fs";
import path from "node:path";
import { tryCatch } from "typecatch";

const PROJECTS_DIR = process.env.PROJECTS_DIR ?? "/Users/tijn/projects/";

if (!fs.existsSync(PROJECTS_DIR)) {
    console.error(
        `Error: PROJECTS_DIR '${PROJECTS_DIR}' does not exist.`,
    );
    process.exit(1);
}

// remove DS_Store
if (fs.existsSync(`${PROJECTS_DIR}/.DS_Store`)) {
    fs.unlinkSync(`${PROJECTS_DIR}/.DS_Store`);
}

const projects = fs.readdirSync(PROJECTS_DIR);
console.log(`Found projects: ${projects.length}`);

for (const project of projects) {
    const projectPath = path.join(PROJECTS_DIR, project);

    if (!isGitProject(projectPath)) continue;

    const remoteUrl = getRemoteUrl(projectPath);
    if (!remoteUrl) continue;

    const info = parseGitUrl(remoteUrl);
    if (!info) {
        console.warn(
            `WARN: Could not parse remote URL '${remoteUrl}' for '${projectPath}'.`,
        );
        continue;
    }

    console.log(`removing all tags from: ${project}`);
    spawnSync(
        ["tag", "--remove", `*`, projectPath],
    );

    console.log(`adding tag '${info.domain!}' to ${project}`);
    spawnSync(
        ["tag", "--add", info.domain!, projectPath],
    );

    const sanitizedRepo = info.repo!.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const newProjectPath = path.join(PROJECTS_DIR, sanitizedRepo);

    if (projectPath === newProjectPath) continue;

    const { error } = tryCatch(() =>
        fs.renameSync(projectPath, newProjectPath)
    );

    if (error) {
        console.error(
            `ERROR: Failed to rename '${projectPath}' to '${newProjectPath}':`,
            error,
        );
    }

    console.log(`${project} -> ${sanitizedRepo}`);
}

function isGitProject(projectPath: string) {
    return (
        fs.existsSync(projectPath) &&
        fs.lstatSync(projectPath).isDirectory() &&
        fs.existsSync(path.join(projectPath, ".git"))
    );
}

function getRemoteUrl(projectPath: string) {
    const { data: remoteUrl, error } = tryCatch(() => {
        const { stdout, stderr, exitCode } = spawnSync(
            ["git", "remote", "get-url", "origin"],
            { cwd: projectPath, stdout: "pipe", stderr: "pipe" },
        );

        if (exitCode !== 0) {
            throw new Error(
                `Error running git command in '${projectPath}': ${stderr.toString().trim()}`,
            );
        }

        return stdout.toString().trim();
    });

    if (error) {
        console.error(
            `Failed to run spawnSync for '${projectPath}':`,
            error.message,
        );
        return null;
    }

    return remoteUrl;
}

function parseGitUrl(url: string) {
    // SSH format: git@domain:owner/repo.git
    const sshMatch = url.match(/^git@([^:]+):([^/]+)\/(.+)\.git$/);
    if (sshMatch) {
        return { domain: sshMatch[1], owner: sshMatch[2], repo: sshMatch[3] };
    }

    // HTTPS format: https://domain/owner/repo(.git?)
    const httpsMatch = url.match(
        /^https?:\/\/([^/]+)\/([^/]+)\/(.+?)(?:\.git)?$/,
    );
    if (httpsMatch) {
        return {
            domain: httpsMatch[1],
            owner: httpsMatch[2],
            repo: httpsMatch[3],
        };
    }

    return null;
}
