# Releasing

Releases go to npm as `crisp-plugin-mcp`. CI publishes every version after the first.

## Each release

1. Merge pull requests to `main`. Each PR title must be a Conventional Commit, such as
   `feat: ...`, `fix: ...`, or `chore: ...`. CI checks the title, and the squash merge uses it as
   the commit message.
2. A merge with a `feat:` or `fix:` commit starts a release with no manual step. release-please
   opens a release PR with the version bump and changelog. The workflow merges that PR, tags
   `vX.Y.Z`, and creates the GitHub release. `fix:` bumps the patch version. Below 1.0, `feat:`
   bumps the minor version. `chore:`, `ci:`, and `docs:` do not start a release.
3. The `npm` job in `.github/workflows/release.yml` checks out the tag and runs `pnpm check`. It
   then builds, packs, installs the tarball in a clean folder, smoke-tests it, and publishes it.
   npm trusted publishing authorizes the job, so the repository stores no npm token.

GitHub starts no workflows for a pull request opened with `GITHUB_TOKEN`, so CI does not run on
the release PR. The `npm` job runs the full check on the tag before it publishes. If that check
fails, the tag and GitHub release exist but npm has no new version. Fix the cause in a new `fix:`
PR, which releases the next patch version.

The `npm` job runs only when the repository variable `NPM_PUBLISH` is `true`. If the job fails,
fix the cause and run the workflow by hand with the tag:

```sh
gh workflow run release.yml --repo amitray007/crisp-plugin-mcp -f tag=v0.2.0
```

## First publish

npm accepts a trusted publisher only for a package that already exists, so publish 0.1.0 by hand
from a checkout of tag `v0.1.0`:

```sh
pnpm install --frozen-lockfile
npm publish --access public
npm trust github crisp-plugin-mcp --file release.yml --repo amitray007/crisp-plugin-mcp --allow-publish --yes
npm access set mfa=publish crisp-plugin-mcp
gh variable set NPM_PUBLISH --repo amitray007/crisp-plugin-mcp --body true
```

`npm publish` builds the package through the `prepack` script. `npm access set mfa=publish` blocks
publishing with a token. Trusted publishing still works.
