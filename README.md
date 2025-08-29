# Decidim::Idra

Idra module for decidim.

## Usage

The “Idra” gem is a decidim-feature that enables interaction between the Idra backend and the Decidim backend. It allows retrieving and displaying all federated dataset catalogs from a specific Idra instance. The latest released version also includes a Zenodo connector to retrieve communities datasets from the platform

## Installation

Add this line to your application's Gemfile:

```ruby
gem "decidim-idra", git: "https://github.com/Road-STEAMer/decidim-module-idra.git"
```

And then execute:

```bash
bundle
bin/rails decidim_idra:install:migrations
bin/rails db:migrate
```

## Contributing

Contributions are welcome !

We expect the contributions to follow the [Decidim's contribution guide](https://github.com/decidim/decidim/blob/develop/CONTRIBUTING.adoc).

## Security

Security is very important to us. If you have any issue regarding security, please disclose the information responsibly by sending an email to __daniele.noto [at] eka [dot] it__ and not by creating a GitHub issue.

## License

This engine is distributed under the GNU AFFERO GENERAL PUBLIC LICENSE.
