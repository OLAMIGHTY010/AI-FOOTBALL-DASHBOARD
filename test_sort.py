import streamlit as st
from streamlit_sortables import sort_items

st.title("Test Sortables")

items = {
    "Starting XI": ["Haaland", "Salah", "Saka"],
    "Bench": ["Palmer", "Isak"]
}

result = sort_items(items, multi_containers=True, direction="vertical")
st.write(result)
