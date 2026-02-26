package node;

import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Collection;
import java.util.List;

import content.Content;
import content.visitor.ContentVisitor;
import node.visitor.NodeVisitor;

public class RootNode implements Node {
	
	private static Optional<RootNode> instance = Optional.empty();
	private Collection<Node> children;

	private RootNode() {
		this.children = List.of(this);
	}
	
	@Override
	public Node parent() {
		return this;
	}

	@Override
	public Collection<Node> children() {
		return this.children;
	}

	@Override
	public Content<?> content() {
		return EmptyContent.getInstance();
	}

	@Override
	public void addChild(Node newChild) {
		this.children = Stream.concat(children.stream(), Stream.of(newChild))
				.distinct()
				.filter(i -> !i.equals(RootNode.getInstance()))
				.collect(Collectors.toList());
	}
	
	@Override
	public <T> T accept(NodeVisitor<T> nodeVisitor) {
		return nodeVisitor.visitRootNode(this);
	}
	
	public static RootNode getInstance() {
		if (instance.isEmpty()) {
			RootNode r = new RootNode();
			instance = Optional.of(r);
		}
		
		return instance.get();
}
	static private class EmptyContent extends Content<String> {
		
		static Optional<EmptyContent> instance = Optional.empty();

		private EmptyContent(){
			super.setContent("It's considered rude to look inside the root node.");
			super.setLinks(List.of());
			super.setVersion(Optional.empty());
		}
		
		
		@Override
		public <R> void link(Content<R> c) {
		}

		@Override
		public <W> W accept(ContentVisitor<W> visitor) {
			return null;
		}
		
		static EmptyContent getInstance() {
			if (instance.isEmpty()) {
				return new EmptyContent();
			}
			else return instance.get();
		}
		
	}

	
}
