class ExpandSavedDatasetsFields < ActiveRecord::Migration[6.0]
  def up
    change_column :saved_datasets, :title, :text
    change_column :saved_datasets, :url, :text
    change_column :saved_datasets, :dataset_id, :text
  end

  def down
    change_column :saved_datasets, :title, :string, limit: 255
    change_column :saved_datasets, :url, :string, limit: 255
    change_column :saved_datasets, :dataset_id, :string, limit: 255
  end
end
