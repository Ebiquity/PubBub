app_dir = "/usr/local/site"

directory app_dir do
  owner "www-data"
  mode 0755
end


web_app "pubbub_site" do
  docroot "#{app_dir}/frontend"
  server_name  node['pubbub']['server-name']
  server_aliases  [ "www.pubbub.test" ]
  allow_override "All"
end
