# MCA monitoring library

Separate library for MCA monitoring generated with MCA CLI.

## Developing
It is important to use at least v14.15 for aws-cdk v2 to work.

1. `nvm use`
2. `npm install`
3. `npm run start`


Commits should use [Conventional Commits format](https://www.conventionalcommits.org/) for changelog generation and versioning.

## Release

`mca-monitoring` uses standard-version to make the version bump, add tags and update the CHANGELOG automatically based on conventional commit messages.

Follow these steps to create a new release:

1. Run `git checkout master` to ensure you are on the master branch
1. Run `git pull` to pull the latest changes
1. Run `npm run release` to create tags and update changelog
1. Run `git push --follow-tags origin master` to push the tags
1. Run `npm pack` to create a release package
1. Go go GitHub and draft a new release
1. Select the tag that was just created
1. Upload the mca-cli-[version].tgz file created from `npm pack`
1. Publish the release

## Documentation

HTML documentation can be build with `npm run docs`. Generated files can be found in docs folder.
