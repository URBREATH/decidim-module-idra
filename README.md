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

## Configuration

You can configure Idra defaults in an initializer, for example `config/initializers/decidim_idra.rb`:

```ruby
Decidim::Idra.open_timeout = 5
Decidim::Idra.read_timeout = 10
Decidim::Idra.default_rows = 5
Decidim::Idra.catalogues_cache_ttl = 600
Decidim::Idra.allowed_api_hosts = ["idra.example.org"]
```

You can also provide extra allowed API hosts via `IDRA_ALLOWED_API_HOSTS` (comma-separated).

## Contributing

Contributions are welcome !

We expect the contributions to follow the [Decidim's contribution guide](https://github.com/decidim/decidim/blob/develop/CONTRIBUTING.adoc).

## Security

Security is very important to us. If you have any issue regarding security, please disclose the information responsibly by sending an email to __daniele.noto [at] eka [dot] it__ and not by creating a GitHub issue.

## License

This engine is distributed under the GNU AFFERO GENERAL PUBLIC LICENSE.
