class AddIndexToSavedDatasets < ActiveRecord::Migration[6.0]
  def change
    add_index :saved_datasets, [:decidim_user_id, :dataset_id], unique: true, name: "index_saved_datasets_on_user_and_dataset"
  end
end
