class SavedDatasets < ApplicationRecord
    belongs_to :decidim_user, class_name: 'Decidim::User'
    
    # Validazioni
    validates :title, presence: true, length: { maximum: 512 }
    validates :decidim_user_id, presence: true
    validates :url, presence: true, length: { maximum: 2048 }
    validates :dataset_id, presence: true, length: { maximum: 2048 }, uniqueness: { scope: :decidim_user_id }
  end
  
